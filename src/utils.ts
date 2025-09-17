/**
 * Utility functions for file I/O, validation, and other common operations
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import type { 
  ValidationError, 
  ConfigFile, 
  FileInputOptions, 
  OutputOptions, 
  CliOptions, 
  VoiceId
} from './types.js';


/**
 * File I/O utilities
 */
export class FileUtils {
  /**
   * Read text file with validation
   */
  static async readTextFile(
    filePath: string, 
    options: FileInputOptions = {}
  ): Promise<string> {
    const {
      encoding = 'utf-8',
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedExtensions = ['.txt', '.md', '.json', '.csv']
    } = options;

    try {
      // Check file exists
      await fs.access(filePath);
      
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
        throw new Error(`File extension ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`);
      }

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > maxSize) {
        throw new Error(`File size ${stats.size} bytes exceeds maximum ${maxSize} bytes`);
      }

      // Read file
      const content = await fs.readFile(filePath, encoding);
      return content.trim();
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write file with output options
   */
  static async writeFile(
    filePath: string, 
    content: string | Buffer, 
    options: OutputOptions = {}
  ): Promise<void> {
    const {
      overwrite = true,
      createDirs = true,
      backup = false
    } = options;

    try {
      // Create directories if needed
      if (createDirs) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Check if file exists and handle backup/overwrite
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      
      if (exists) {
        if (!overwrite) {
          throw new Error(`File ${filePath} already exists and overwrite is disabled`);
        }
        
        if (backup) {
          const backupPath = `${filePath}.backup.${Date.now()}`;
          await fs.copyFile(filePath, backupPath);
        }
      }

      // Write file
      await fs.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if path is safe (no directory traversal)
   */
  static isSafePath(filePath: string, baseDir: string = process.cwd()): boolean {
    const resolved = path.resolve(baseDir, filePath);
    const relative = path.relative(baseDir, resolved);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars
      .replace(/\s+/g, '_') // Replace spaces
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Generate unique filename if file exists
   */
  static async generateUniqueFilename(filePath: string): Promise<string> {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);

    let counter = 1;
    let uniquePath = filePath;

    while (await fs.access(uniquePath).then(() => true).catch(() => false)) {
      uniquePath = path.join(dir, `${name}_${counter}${ext}`);
      counter++;
    }

    return uniquePath;
  }
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
  private static readonly CONFIG_FILENAME = '.kokororc';

  /**
   * Load configuration file
   */
  static async loadConfig(configPath?: string): Promise<ConfigFile | null> {
    const searchPaths = configPath ? [configPath] : [
      path.join(process.cwd(), this.CONFIG_FILENAME),
      path.join(process.cwd(), `${this.CONFIG_FILENAME}.yml`),
      path.join(process.cwd(), `${this.CONFIG_FILENAME}.yaml`),
      path.join(process.cwd(), `${this.CONFIG_FILENAME}.json`),
      path.join(os.homedir(), this.CONFIG_FILENAME)
    ];

    for (const searchPath of searchPaths) {
      try {
        await fs.access(searchPath);
        const content = await fs.readFile(searchPath, 'utf-8');
        const ext = path.extname(searchPath);
        
        if (ext === '.json') {
          return JSON.parse(content);
        } else {
          return yaml.parse(content);
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Save configuration file
   */
  static async saveConfig(config: ConfigFile, configPath?: string): Promise<string> {
    const filePath = configPath || path.join(process.cwd(), `${this.CONFIG_FILENAME}.yml`);
    const content = yaml.stringify(config, { indent: 2 });
    await FileUtils.writeFile(filePath, content, { createDirs: true });
    return filePath;
  }

  /**
   * Merge configuration with defaults
   */
  static mergeWithDefaults(config: ConfigFile, defaults: Partial<CliOptions>): Partial<CliOptions> {
    return {
      ...defaults,
      ...config.defaults
    };
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate CLI options
   */
  static validateCliOptions(options: Partial<CliOptions>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate speed
    if (options.speed !== undefined) {
      if (options.speed < 0.5 || options.speed > 2.0) {
        errors.push({
          field: 'speed',
          message: 'Speed must be between 0.5 and 2.0',
          value: options.speed
        });
      }
    }

    // Validate temperature
    if (options.temperature !== undefined) {
      if (options.temperature < 0.1 || options.temperature > 1.0) {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be between 0.1 and 1.0',
          value: options.temperature
        });
      }
    }

    // Validate voice
    if (options.voice && !this.isValidVoice(options.voice)) {
      errors.push({
        field: 'voice',
        message: 'Invalid voice ID',
        value: options.voice
      });
    }

    // Validate input
    if (!options.text && !options.inputFile && !options.help && !options.listVoices && !options.interactive) {
      errors.push({
        field: 'input',
        message: 'Either provide text, use --file to specify input file, or use interactive mode'
      });
    }

    return errors;
  }

  /**
   * Validate voice ID (simplified - actual validation in voices.ts)
   */
  private static isValidVoice(voice: string): voice is VoiceId {
    const validVoices = [
      'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore',
      'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
      'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael',
      'am_onyx', 'am_puck', 'am_santa',
      'bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily',
      'bm_george', 'bm_lewis', 'bm_daniel', 'bm_fable'
    ];
    return validVoices.includes(voice as VoiceId);
  }

  /**
   * Validate file path
   */
  static validateFilePath(filePath: string, _mustExist = true): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!filePath || filePath.trim().length === 0) {
      errors.push({
        field: 'filePath',
        message: 'File path cannot be empty',
        value: filePath
      });
      return errors;
    }

    if (!FileUtils.isSafePath(filePath)) {
      errors.push({
        field: 'filePath',
        message: 'File path contains directory traversal',
        value: filePath
      });
    }

    // Additional validation would require async operation
    // This is a basic synchronous validation

    return errors;
  }
}

/**
 * String utilities
 */
export class StringUtils {
  /**
   * Format duration in human-readable format
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs.toFixed(2)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}h ${minutes}m ${secs.toFixed(2)}s`;
    }
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Clean text for TTS (remove problematic characters)
   */
  static cleanTextForTTS(text: string): string {
    return text
      .replace(/[^\x00-\x7F\u00A0-\u024F\u1E00-\u1EFF]/g, '') // Remove non-Latin characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Split text into chunks for processing
   */
  static splitTextIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
    if (text.length <= maxChunkSize) return [text];

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = trimmedSentence;
        } else {
          // Sentence is too long, split by words
          const words = trimmedSentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length + 1 <= maxChunkSize) {
              wordChunk += (wordChunk ? ' ' : '') + word;
            } else {
              if (wordChunk) {
                chunks.push(wordChunk);
                wordChunk = word;
              } else {
                chunks.push(word); // Single word too long
              }
            }
          }
          
          if (wordChunk) {
            currentChunk = wordChunk;
          }
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    return chunks;
  }
}

/**
 * Progress utilities
 */
export class ProgressUtils {
  /**
   * Create a simple progress bar
   */
  static createProgressBar(current: number, total: number, width: number = 40): string {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage.toFixed(1)}%`;
  }

  /**
   * Estimate remaining time
   */
  static estimateRemainingTime(startTime: number, current: number, total: number): string {
    if (current === 0) return 'Unknown';
    
    const elapsed = Date.now() - startTime;
    const rate = current / elapsed;
    const remaining = (total - current) / rate;
    
    return StringUtils.formatDuration(remaining / 1000);
  }
}

/**
 * Platform utilities
 */
export class PlatformUtils {
  /**
   * Get platform-specific audio player commands
   */
  static getAudioPlayerCommands(filePath: string): string[] {
    const platform = process.platform;
    const quotedPath = `"${filePath}"`;
    
    switch (platform) {
      case 'linux':
        return [
          `ffplay ${quotedPath}`,
          `aplay ${quotedPath}`,
          `paplay ${quotedPath}`
        ];
      case 'darwin':
        return [`afplay ${quotedPath}`];
      case 'win32':
        return [`start ${quotedPath}`];
      default:
        return [`ffplay ${quotedPath}`];
    }
  }

  /**
   * Check if command exists
   */
  static async commandExists(command: string): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      const checkCmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
      execSync(checkCmd, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

// Import os for homedir
import os from 'os';