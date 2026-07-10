import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

let openai: OpenAI | null = null;
let language = process.env.LANGUAGE || "Python";

interface Config {
  apiKey: string;
  language: string;
}

function updateConfig(config: Config) {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  try {
    openai = new OpenAI({
      apiKey: config.apiKey.trim(),
    });
    language = config.language || 'js';
    // console.log('OpenAI client initialized with new config');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
}

// Initialize with environment variables if available
if (process.env.OPENAI_API_KEY) {
  try {
    updateConfig({
      apiKey: process.env.OPENAI_API_KEY,
      language: process.env.LANGUAGE || 'Python'
    });
  } catch (error) {
    console.error('Error initializing OpenAI with environment variables:', error);
  }
}

interface ProcessedSolution {
  approach: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  dryRun: string;
}

type MessageContent = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function normalizeSolution(value: any): ProcessedSolution {
  return {
    approach: String(value?.approach ?? ''),
    code: String(value?.code ?? ''),
    timeComplexity: String(value?.timeComplexity ?? ''),
    spaceComplexity: String(value?.spaceComplexity ?? ''),
    dryRun: String(value?.dryRun ?? '')
  };
}

function parseSolutionContent(content: string): ProcessedSolution {
  try {
    return normalizeSolution(JSON.parse(content));
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const jsonSlice = content.slice(start, end + 1);
      return normalizeSolution(JSON.parse(jsonSlice));
    }
    throw new Error('Model response is not valid JSON');
  }
}

export async function processScreenshots(screenshots: { path: string }[]): Promise<ProcessedSolution> {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please configure API key first. Click CTRL/CMD + P to open settings and set the API key.');
  }

  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are an expert coding interview assistant. 
        Analyze the coding question from the screenshots and provide a solution in ${language},
        think like a staff software engineer and provide answer for human written not AI generated.
                 Return ONLY a valid JSON object in the following format (no markdown or extra text):
                 {
                   "approach": "Detailed approach to solve the problem on how are we solving the problem, that the interviewee will speak out loud and in easy explainatory words and steps to solve the problem with pattern or technique used",
                   "code": "The complete solution code",
                   "timeComplexity": "Big O analysis of time complexity with the reason",
                   "spaceComplexity": "Big O analysis of space complexity with the reason",
                   "dryRun": "A dry run of the code with an example input and output, explaining each step of the code execution"
                 }`
      },
      {
        role: "user" as const,
        content: [
          { type: "text", text: "Here is a coding interview question. Please analyze and provide a solution." } as MessageContent
        ]
      }
    ];

    // Add screenshots as image URLs
    for (const screenshot of screenshots) {
      const base64Image = await fs.readFile(screenshot.path, { encoding: 'base64' });
      messages.push({
        role: "user" as const,
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          } as MessageContent
        ]
      });
    }

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    return parseSolutionContent(content);
  } catch (error) {
    console.error('Error processing screenshots:', error);
    throw error;
  }
}

export default {
  processScreenshots,
  updateConfig
};
