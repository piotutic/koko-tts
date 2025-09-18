/**
 * Directory management service for Koko TTS
 * Manages the unified .koko-tts directory structure
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export interface DirectoryPaths {
  root: string;
  config: string;
  cache: string;
  outputs: string;
  temp: string;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  tempDir: string;
}

export class DirectoryService {
  private static instance: DirectoryService;
  private readonly rootDir: string;
  private readonly paths: DirectoryPaths;
  private session: SessionInfo;

  private constructor(rootDir = '.koko-tts') {
    this.rootDir = path.resolve(rootDir);
    this.paths = {
      root: this.rootDir,
      config: path.join(this.rootDir, 'config'),
      cache: path.join(this.rootDir, 'cache'),
      outputs: path.join(this.rootDir, 'outputs'),
      temp: path.join(this.rootDir, 'temp')
    };
    
    // Generate session ID
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      tempDir: path.join(this.paths.temp, this.generateSessionId())
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(rootDir?: string): DirectoryService {
    if (!DirectoryService.instance) {
      DirectoryService.instance = new DirectoryService(rootDir);
    }
    return DirectoryService.instance;
  }

  /**
   * Initialize all required directories
   */
  async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.paths.config, { recursive: true });
      await fs.mkdir(this.paths.cache, { recursive: true });
      await fs.mkdir(this.paths.outputs, { recursive: true });
      await fs.mkdir(this.session.tempDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(filename = 'config.yml'): string {
    return path.join(this.paths.config, filename);
  }

  /**
   * Get cache directory path
   */
  getCacheDir(): string {
    return this.paths.cache;
  }

  /**
   * Get output directory with optional organization
   */
  getOutputDir(mode: 'cli' | 'interactive' | 'batch' = 'cli', useDate = true): string {
    let outputDir = this.paths.outputs;
    
    if (mode !== 'cli') {
      outputDir = path.join(outputDir, mode);
    }
    
    if (useDate) {
      const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD - will always exist
      outputDir = path.join(outputDir, today);
    }
    
    return outputDir;
  }

  /**
   * Get session-specific temp directory
   */
  getTempDir(): string {
    return this.session.tempDir;
  }

  /**
   * Get default output filename with timestamp
   */
  getDefaultOutputFilename(prefix = 'koko', extension = 'wav'): string {
    const timestamp = new Date().toISOString()
      .replace(/[:-]/g, '')
      .replace(/\.\d{3}Z$/, '');
    return `${prefix}_${timestamp}.${extension}`;
  }

  /**
   * Generate smart output path
   */
  async getSmartOutputPath(
    filename?: string,
    mode: 'cli' | 'interactive' | 'batch' = 'cli',
    useDate = true
  ): Promise<string> {
    const outputDir = this.getOutputDir(mode, useDate);
    await fs.mkdir(outputDir, { recursive: true });
    
    const finalFilename = filename || this.getDefaultOutputFilename();
    return path.join(outputDir, finalFilename);
  }

  /**
   * Clean up old temp files
   */
  async cleanupTempFiles(maxAgeHours = 24): Promise<void> {
    try {
      const tempDir = this.paths.temp;
      const entries = await fs.readdir(tempDir, { withFileTypes: true });
      const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sessionDir = path.join(tempDir, entry.name);
          try {
            const stats = await fs.stat(sessionDir);
            if (stats.birthtime.getTime() < maxAge) {
              await fs.rm(sessionDir, { recursive: true, force: true });
            }
          } catch (error) {
            // Ignore errors for individual directory cleanup
          }
        }
      }
    } catch (error) {
      // Ignore errors - temp cleanup is not critical
    }
  }

  /**
   * Migrate from old directory structure
   */
  async migrateFromLegacy(): Promise<{ config: boolean; cache: boolean }> {
    const results = { config: false, cache: false };
    
    try {
      // Migrate config from .kokororc.yml
      const oldConfigPath = path.resolve('.kokororc.yml');
      const newConfigPath = this.getConfigPath();
      
      try {
        await fs.access(oldConfigPath);
        await fs.mkdir(path.dirname(newConfigPath), { recursive: true });
        await fs.copyFile(oldConfigPath, newConfigPath);
        results.config = true;
      } catch {
        // Old config doesn't exist - no migration needed
      }
      
      // Migrate cache from .koko-cache
      const oldCacheDir = path.resolve('.koko-cache');
      const newCacheDir = this.getCacheDir();
      
      try {
        await fs.access(oldCacheDir);
        await fs.mkdir(path.dirname(newCacheDir), { recursive: true });
        
        // Copy cache directory contents
        const entries = await fs.readdir(oldCacheDir, { withFileTypes: true });
        for (const entry of entries) {
          const oldPath = path.join(oldCacheDir, entry.name);
          const newPath = path.join(newCacheDir, entry.name);
          
          if (entry.isDirectory()) {
            await this.copyDirectory(oldPath, newPath);
          } else {
            await fs.copyFile(oldPath, newPath);
          }
        }
        results.cache = true;
      } catch {
        // Old cache doesn't exist - no migration needed
      }
      
    } catch (error) {
      // Migration errors are not critical
    }
    
    return results;
  }

  /**
   * Get current session info
   */
  getSessionInfo(): SessionInfo {
    return { ...this.session };
  }

  /**
   * Get all directory paths
   */
  getPaths(): DirectoryPaths {
    return { ...this.paths };
  }

  /**
   * Check if koko-tts directory exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.rootDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Recursively copy directory
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Export singleton instance getter
export const getDirectoryService = (rootDir?: string) => DirectoryService.getInstance(rootDir);