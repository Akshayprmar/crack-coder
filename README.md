# CrackCoder - Invisible AI-Powered Interview Assistant

A powerful, completely invisible AI tool for solving coding questions during technical interviews. The tool runs 100% undetectably in the background - no screen recording or monitoring software can identify its presence.

Open-source Alternative to Interview Coder

## Demo
https://github.com/user-attachments/assets/179701eb-0fcf-4e33-86f3-c92688f508a5

## 🎯 Screen Sharing Invisibility Options.

When sharing your screen during interviews, you need to keep CrackCoder invisible to others. We provide **4 different implementation options**:

### 🖥️ Option 1: Multiple Display Setup
- **Best for**: Home setup with external monitor
- **Method**: Use CrackCoder on private screen, share clean screen
- **Reliability**: ⭐⭐⭐⭐⭐ (100% foolproof)

### 🪟 Option 2: Electron Window Management  
- **Best for**: Advanced users
- **Method**: Separate AI window + clean public interface
- **Reliability**: ⭐⭐⭐⭐

### 🎭 Option 3: Screen Capture Filtering (Recommended)
- **Best for**: Single monitor setups
- **Method**: OBS Studio + Virtual Camera to exclude CrackCoder
- **Reliability**: ⭐⭐⭐⭐⭐

### 📱 Option 4: Virtual Display Technology
- **Best for**: Professional setups
- **Method**: Virtual displays for sharing
- **Reliability**: ⭐⭐⭐⭐

📖 **[Complete Implementation Guide →](SCREEN_SHARING_OPTIONS.md)**

## Features

- 🔒 **100% Undetectable** - Multiple stealth modes and invisibility options
- 🤖 **Real-time AI assistance** for solving coding problems
- 🌐 **Multi-language support** - Python, Java, JavaScript, C++, and more
- 🎯 **Precise solutions** with approach, code, and complexity analysis
- ⚙️ **Easy configuration** - Simple API key setup
- 🎭 **Advanced stealth features** - Content protection, transparency, click-through


## Quick Start Guide

### Step 1: Choose Your Invisibility Method
Review the **[Screen Sharing Options Guide](SCREEN_SHARING_OPTIONS.md)** and pick the best method for your setup:

- **🖥️ Multiple Monitors?** → Use Option 1 (Hardware separation)
- **💻 Single Monitor?** → Use Option 3 (OBS + Virtual Camera)  
- **🔒 High Security?** → Use Option 2 (Dual interface) + Option 3

### Step 2: Install Dependencies

#### Option 3 (Recommended for most users):
```bash
# Install OBS Studio for screen filtering
brew install --cask obs
```

### Step 3: Setup CrackCoder

#### Local Setup:
```bash
# Clone the repository
git clone https://github.com/yourusername/crackcode.git
cd crackcode

# Install dependencies
npm install

# Start the application
npm start
```

#### Quick Configuration:
1. Press `⌘/Ctrl + P` to open settings
2. Add your OpenAI API key
3. Select preferred programming language
4. Save configuration

### Step 4: Test Your Setup
1. Start a test screen share
2. Take a screenshot with `⌘/Ctrl + H`
3. Verify CrackCoder is invisible to others
4. Get a solution with `⌘/Ctrl + ↵`

## Prerequisites

- **Node.js** (v14 or higher) - for local setup
- **npm** (Node Package Manager) - for local setup  
- **OpenAI API key** - for AI functionality
- **OBS Studio** (optional) - for advanced screen filtering

## Advanced Configuration

### Environment Variables
Create a `.env` file or configure via Settings (`⌘/Ctrl + P`):

```env
# OpenAI API Key - Required for AI functionality
OPENAI_API_KEY="your-api-key-here"

# Programming Language Setting  
# Supported: Java, Python, JavaScript, TypeScript, C++, C, Go, Rust
APP_LANGUAGE="Java"
```

### Stealth Mode Configuration
The app includes multiple invisibility layers:

1. **Basic Stealth** (Always active):
   - Transparent window
   - No taskbar presence  
   - Content protection

2. **Enhanced Stealth** (`⌘/Ctrl + Shift + S`):
   - Near-invisible opacity
   - Click-through mode
   - Auto-hide on blur

3. **Screen Sharing Protection**:
   - See [SCREEN_SHARING_OPTIONS.md](SCREEN_SHARING_OPTIONS.md) for detailed setup

## Troubleshooting

### Common Issues:

#### "OpenAI API key required" Error:
- Press `⌘/Ctrl + P` to open settings
- Enter your OpenAI API key
- Save configuration

#### Window Not Visible:
- Press `⌘/Ctrl + B` to toggle visibility
- Use arrow keys to move window if off-screen
- Check if stealth mode is too aggressive

#### Screenshots Not Working:
- Ensure screen recording permissions are granted
- Check System Preferences → Security & Privacy → Privacy → Screen Recording
- Add CrackCoder to allowed apps

#### OBS Virtual Camera Issues:
```bash
# Reset camera permissions
sudo tccutil reset Camera
# Restart OBS Studio
```

### Performance Optimization:
- Close unnecessary applications during interviews
- Use hardware acceleration when available
- Reduce window opacity in stealth mode if needed

## Development

### Build Commands:
```bash
npm run build          # Build for production
npm run dev            # Development with hot reload  
npm run watch          # Watch mode
npm run dist           # Create distributable package
npm run dist:mac       # macOS-specific build
npm run dist:win       # Windows-specific build
```

### Project Structure:
```
crack-coder/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script
│   ├── renderer/            # React UI components
│   └── services/            # AI service integration
├── package.json
├── README.md
└── SCREEN_SHARING_OPTIONS.md # Invisibility implementation guide
```

## Shortcuts

### Screenshot & Processing
- **📸 Take Screenshot**: `⌘/Ctrl + H`
- **🚀 Get Solution**: `⌘/Ctrl + ↵/Enter`
- **🔄 Reset Queue**: `⌘/Ctrl + R`

### Window Controls
- **👁️ Show/Hide**: `⌘/Ctrl + B`
- **⚙️ Settings/Config**: `⌘/Ctrl + P`
- **🥷 Stealth Mode**: `⌘/Ctrl + Shift + S` (Enhanced invisibility)
- **🚪 Quit**: `⌘/Ctrl + Q`

### Window Movement
- **🔄 Move Around**: `⌘/Ctrl + Arrow Keys`

### Advanced Stealth Features
- **Content Protection**: Prevents screen recording of the window
- **Transparency Mode**: Makes window nearly invisible when not in focus
- **Click-through Mode**: Mouse events pass through the window
- **Dock Hiding**: Completely hidden from macOS Dock and App Switcher

## Contributing
We welcome contributions! Please feel free to submit a Pull Request.

## Support
If you find this tool helpful, please consider giving it a star ⭐️
