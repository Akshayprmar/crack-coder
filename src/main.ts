import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import openaiService from './services/openai';

const execFileAsync = promisify(execFile);

interface Screenshot {
  id: number;
  preview: string;
  path: string;
}

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
console.log(CONFIG_FILE);

interface Config {
  apiKey: string;
  language: string;
}

let config: Config | null = null;

let mainWindow: BrowserWindow | null = null;
let screenshotQueue: Screenshot[] = [];
let isProcessing = false;
let isStealthModeEnabled = false;
const MAX_SCREENSHOTS = 4;
const SCREENSHOT_DIR = path.join(app.getPath('temp'), 'screenshots');

function handleStealthBlur() {
  if (isStealthModeEnabled) {
    mainWindow?.setOpacity(0.05);
  }
}

function handleStealthFocus() {
  if (isStealthModeEnabled) {
    mainWindow?.setOpacity(0.95);
  }
}

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

async function loadConfig(): Promise<Config | null> {
  try {
    // First try loading from environment variables
    const envApiKey = process.env.OPENAI_API_KEY;
    const envLanguage = process.env.APP_LANGUAGE;

    if (envApiKey && envLanguage) {
      const envConfig = {
        apiKey: envApiKey,
        language: envLanguage
      };
      openaiService.updateConfig(envConfig);
      return envConfig;
    }

    // If env vars not found, try loading from config file
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const loadedConfig = JSON.parse(data);
    if (loadedConfig && loadedConfig.apiKey && loadedConfig.language) {
      openaiService.updateConfig(loadedConfig);
      return loadedConfig;
    }
    return null;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

async function saveConfig(newConfig: Config): Promise<void> {
  try {
    if (!newConfig.apiKey || !newConfig.language) {
      throw new Error('Invalid configuration');
    }
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    config = newConfig;
    // Update OpenAI service with new config
    openaiService.updateConfig(newConfig);
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,           
    transparent: true,     
    backgroundColor: "#00000000",  
    hasShadow: false,    
    alwaysOnTop: true,     
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Enhanced privacy features
    skipTaskbar: true,        // Hide from taskbar
    minimizable: true,       // Allow minimize
    maximizable: false,       // Prevent maximize
    resizable: false,         // Prevent resize
    focusable: true,          // Allow input and scroll interactions
    show: false              // Don't show initially
  });

  // Open DevTools by default in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Register DevTools shortcut
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Enable content protection to prevent screen capture
  mainWindow.setContentProtection(true);

  // Platform specific enhancements for macOS
  if (process.platform === 'darwin') {
    mainWindow.setHiddenInMissionControl(true);
    mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    });
    mainWindow.setAlwaysOnTop(true, "floating");

    // Keep mouse interactions enabled by default so the UI remains scrollable.
    // Users can still enable full click-through via the stealth mode shortcut.
    mainWindow.setVisibleOnAllWorkspaces(true);
    
    // Hide from Dock and App Switcher
    app.dock?.hide();
  }

  // Show window after setup
  mainWindow.show();

  // Load the index.html file from the dist directory
  mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));

  // Register global shortcuts
  registerShortcuts();
}

function registerShortcuts() {
  // Screenshot & Processing shortcuts
  globalShortcut.register('CommandOrControl+H', handleTakeScreenshot);
  globalShortcut.register('CommandOrControl+Enter', handleProcessScreenshots);
  globalShortcut.register('CommandOrControl+R', handleResetQueue);
  globalShortcut.register('CommandOrControl+Q', () => app.quit());
  
  // Window visibility
  globalShortcut.register('CommandOrControl+B', handleToggleVisibility);
  
  // Window movement
  globalShortcut.register('CommandOrControl+Left', () => moveWindow('left'));
  globalShortcut.register('CommandOrControl+Right', () => moveWindow('right'));
  globalShortcut.register('CommandOrControl+Up', () => moveWindow('up'));
  globalShortcut.register('CommandOrControl+Down', () => moveWindow('down'));

  // Config shortcut
  globalShortcut.register('CommandOrControl+P', () => {
    mainWindow?.webContents.send('show-config');
  });

  // Stealth mode toggle (press again to disable)
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    enableStealthMode();
  });

  // Emergency shortcut to force-disable stealth mode
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    disableStealthMode();
  });
}

async function captureScreenshot(): Promise<Buffer> {
  if (process.platform === 'darwin') {
    const tmpPath = path.join(SCREENSHOT_DIR, `${Date.now()}.png`);
    await execFileAsync('screencapture', ['-x', tmpPath]);
    const buffer = await fs.readFile(tmpPath);
    await fs.unlink(tmpPath);
    return buffer;
  } else {
    // Windows implementation
    const tmpPath = path.join(SCREENSHOT_DIR, `${Date.now()}.png`);
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $bitmap.Size)
      $bitmap.Save('${tmpPath.replace(/\\/g, "\\\\")}')
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    await execFileAsync('powershell', ['-command', script]);
    const buffer = await fs.readFile(tmpPath);
    await fs.unlink(tmpPath);
    return buffer;
  }
}

async function handleTakeScreenshot() {
  if (screenshotQueue.length >= MAX_SCREENSHOTS) return;

  try {
    // Hide window before taking screenshot
    mainWindow?.hide();
    await new Promise(resolve => setTimeout(resolve, 100));

    const buffer = await captureScreenshot();
    const id = Date.now();
    const screenshotPath = path.join(SCREENSHOT_DIR, `${id}.png`);
    
    await fs.writeFile(screenshotPath, buffer);
    const preview = `data:image/png;base64,${buffer.toString('base64')}`;
    
    const screenshot = { id, preview, path: screenshotPath };
    screenshotQueue.push(screenshot);

    mainWindow?.show();
    mainWindow?.webContents.send('screenshot-taken', screenshot);
  } catch (error) {
    console.error('Error taking screenshot:', error);
    mainWindow?.show();
  }
}

async function handleProcessScreenshots() {
  if (isProcessing || screenshotQueue.length === 0) return;
  
  isProcessing = true;
  mainWindow?.webContents.send('processing-started');

  try {
    const result = await openaiService.processScreenshots(screenshotQueue);
    // Check if processing was cancelled
    if (!isProcessing) return;
    mainWindow?.webContents.send('processing-complete', JSON.stringify(result));
  } catch (error: any) {
    console.error('Error processing screenshots:', error);
    // Check if processing was cancelled
    if (!isProcessing) return;
    
    // Extract the most relevant error message
    let errorMessage = 'Error processing screenshots';
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    mainWindow?.webContents.send('processing-complete', JSON.stringify({
      error: errorMessage,
      approach: 'Error occurred while processing',
      code: 'Error: ' + errorMessage,
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A'
    }));
  } finally {
    isProcessing = false;
  }
}

async function handleResetQueue() {
  // Cancel any ongoing processing
  if (isProcessing) {
    isProcessing = false;
    mainWindow?.webContents.send('processing-complete', JSON.stringify({
      approach: 'Processing cancelled',
      code: '',
      timeComplexity: '',
      spaceComplexity: ''
    }));
  }

  // Delete all screenshot files
  for (const screenshot of screenshotQueue) {
    try {
      await fs.unlink(screenshot.path);
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  }
  
  screenshotQueue = [];
  mainWindow?.webContents.send('queue-reset');
}

function handleToggleVisibility() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
}

function moveWindow(direction: 'left' | 'right' | 'up' | 'down') {
  if (!mainWindow) return;
  
  const [x, y] = mainWindow.getPosition();
  const moveAmount = 50;
  
  switch (direction) {
    case 'left':
      mainWindow.setPosition(x - moveAmount, y);
      break;
    case 'right':
      mainWindow.setPosition(x + moveAmount, y);
      break;
    case 'up':
      mainWindow.setPosition(x, y - moveAmount);
      break;
    case 'down':
      mainWindow.setPosition(x, y + moveAmount);
      break;
  }
}

// Add browser detection and additional stealth mode
function enableStealthMode() {
  if (!mainWindow) return;

  if (isStealthModeEnabled) {
    disableStealthMode();
    return;
  }

  isStealthModeEnabled = true;
  
  // Maximum stealth configuration
  mainWindow.setSkipTaskbar(true);
  mainWindow.setContentProtection(true);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  if (process.platform === 'darwin') {
    // macOS specific stealth
    mainWindow.setHiddenInMissionControl(true);
    app.dock?.hide();
    
    // Set window level to be above screen recording
    mainWindow.setAlwaysOnTop(true, "screen-saver");
  }
  
  // Make window nearly transparent when not in use
  mainWindow.setOpacity(0.1);
  
  // Auto-hide when other apps are focused
  mainWindow.removeListener('blur', handleStealthBlur);
  mainWindow.removeListener('focus', handleStealthFocus);
  mainWindow.on('blur', handleStealthBlur);
  mainWindow.on('focus', handleStealthFocus);
}

function disableStealthMode() {
  if (!mainWindow) return;

  isStealthModeEnabled = false;

  mainWindow.removeListener('blur', handleStealthBlur);
  mainWindow.removeListener('focus', handleStealthFocus);
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.setOpacity(1);

  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'floating');
  } else {
    mainWindow.setAlwaysOnTop(true);
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
    app.dock?.hide();
  }

  await ensureScreenshotDir();
  // Load config before creating window
  config = await loadConfig();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  handleResetQueue();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('take-screenshot', handleTakeScreenshot);
ipcMain.handle('process-screenshots', handleProcessScreenshots);
ipcMain.handle('reset-queue', handleResetQueue);

// Window control events
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.on('toggle-visibility', handleToggleVisibility);

// Add these IPC handlers before app.whenReady()
ipcMain.handle('get-config', async () => {
  try {
    if (!config) {
      config = await loadConfig();
    }
    return config;
  } catch (error) {
    console.error('Error getting config:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (_, newConfig: Config) => {
  try {
    await saveConfig(newConfig);
    return true;
  } catch (error) {
    console.error('Error in save-config handler:', error);
    return false;
  }
});