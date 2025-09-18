/**
 * Simple caching service for TTS CLI
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { VoiceId, GenerationOptions } from '../types.js'
import { getDirectoryService } from './directory.js'

export interface CacheEntry {
  key: string
  text: string
  voice: VoiceId
  options: Partial<GenerationOptions>
  filePath: string
  createdAt: number
  accessedAt: number
  size: number
}

export interface CacheIndex {
  entries: Record<string, CacheEntry>
  totalSize: number
  lastCleanup: number
}

export interface CacheStats {
  hits: number
  misses: number
  totalEntries: number
  totalSize: number
  hitRate: number
}

export interface CacheConfig {
  enabled: boolean
  directory: string
  maxSize: number // bytes
  maxAge: number // milliseconds
  maxEntries: number
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  directory: '', // Will be set by directory service
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 1000
}

export class CacheService {
  private config: CacheConfig
  private index: CacheIndex
  private stats: CacheStats
  private indexPath: string
  private statsPath: string
  private entriesDir: string

  constructor(config: Partial<CacheConfig> = {}) {
    // Use directory service for cache directory if not specified
    const directoryService = getDirectoryService()
    const defaultConfig = {
      ...DEFAULT_CACHE_CONFIG,
      directory: directoryService.getCacheDir()
    }
    
    this.config = { ...defaultConfig, ...config }
    this.indexPath = path.join(this.config.directory, 'index.json')
    this.statsPath = path.join(this.config.directory, 'stats.json')
    this.entriesDir = path.join(this.config.directory, 'entries')
    
    this.index = {
      entries: {},
      totalSize: 0,
      lastCleanup: Date.now()
    }
    
    this.stats = {
      hits: 0,
      misses: 0,
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0
    }
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return

    try {
      // Create cache directory structure
      await fs.mkdir(this.entriesDir, { recursive: true })
      
      // Load existing index and stats
      await this.loadIndex()
      await this.loadStats()
      
      // Cleanup expired entries
      await this.cleanup()
    } catch (error) {
      console.warn('Cache initialization failed, running without cache:', error)
      this.config.enabled = false
    }
  }

  private generateCacheKey(text: string, voice: VoiceId, options: Partial<GenerationOptions>): string {
    const normalizedOptions = {
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7
    }
    
    const key = JSON.stringify({ text, voice, options: normalizedOptions })
    return crypto.createHash('sha256').update(key).digest('hex')
  }

  async get(text: string, voice: VoiceId, options: Partial<GenerationOptions> = {}): Promise<string | null> {
    if (!this.config.enabled) return null

    const key = this.generateCacheKey(text, voice, options)
    const entry = this.index.entries[key]

    if (!entry) {
      this.stats.misses++
      this.updateStats()
      return null
    }

    // Check if entry is expired
    if (Date.now() - entry.createdAt > this.config.maxAge) {
      await this.deleteEntry(key)
      this.stats.misses++
      this.updateStats()
      return null
    }

    // Check if file still exists
    try {
      await fs.access(entry.filePath)
      
      // Update access time
      entry.accessedAt = Date.now()
      await this.saveIndex()
      
      this.stats.hits++
      this.updateStats()
      return entry.filePath
    } catch {
      // File was deleted, remove from index
      await this.deleteEntry(key)
      this.stats.misses++
      this.updateStats()
      return null
    }
  }

  async set(text: string, voice: VoiceId, audioFilePath: string, options: Partial<GenerationOptions> = {}): Promise<void> {
    if (!this.config.enabled) return

    const key = this.generateCacheKey(text, voice, options)
    const entryDir = path.join(this.entriesDir, key)
    const cachedFilePath = path.join(entryDir, 'audio.wav')
    const metadataPath = path.join(entryDir, 'metadata.json')

    try {
      // Create entry directory
      await fs.mkdir(entryDir, { recursive: true })
      
      // Copy audio file to cache
      await fs.copyFile(audioFilePath, cachedFilePath)
      
      // Get file size
      const stats = await fs.stat(cachedFilePath)
      const size = stats.size

      // Create cache entry
      const entry: CacheEntry = {
        key,
        text,
        voice,
        options,
        filePath: cachedFilePath,
        createdAt: Date.now(),
        accessedAt: Date.now(),
        size
      }

      // Save metadata
      await fs.writeFile(metadataPath, JSON.stringify(entry, null, 2))

      // Update index
      this.index.entries[key] = entry
      this.index.totalSize += size

      // Check if we need to evict entries
      await this.enforceConstraints()
      
      await this.saveIndex()
      this.updateStats()
    } catch (error) {
      console.warn('Failed to cache audio:', error)
    }
  }

  private async deleteEntry(key: string): Promise<void> {
    const entry = this.index.entries[key]
    if (!entry) return

    try {
      const entryDir = path.dirname(entry.filePath)
      await fs.rm(entryDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }

    this.index.totalSize -= entry.size
    delete this.index.entries[key]
  }

  private async enforceConstraints(): Promise<void> {
    const entries = Object.values(this.index.entries)
    
    // Check size constraint
    if (this.index.totalSize > this.config.maxSize) {
      // Sort by access time (LRU)
      entries.sort((a, b) => a.accessedAt - b.accessedAt)
      
      while (this.index.totalSize > this.config.maxSize && entries.length > 0) {
        const entry = entries.shift()
        if (entry) {
          await this.deleteEntry(entry.key)
        }
      }
    }

    // Check entry count constraint
    if (entries.length > this.config.maxEntries) {
      entries.sort((a, b) => a.accessedAt - b.accessedAt)
      
      while (entries.length > this.config.maxEntries) {
        const entry = entries.shift()
        if (entry) {
          await this.deleteEntry(entry.key)
        }
      }
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now()
    const entries = Object.values(this.index.entries)
    
    for (const entry of entries) {
      if (now - entry.createdAt > this.config.maxAge) {
        await this.deleteEntry(entry.key)
      }
    }
    
    this.index.lastCleanup = now
    await this.saveIndex()
  }

  private async loadIndex(): Promise<void> {
    try {
      const content = await fs.readFile(this.indexPath, 'utf-8')
      this.index = JSON.parse(content)
    } catch {
      // Index doesn't exist or is corrupted, use defaults
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2))
    } catch (error) {
      console.warn('Failed to save cache index:', error)
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const content = await fs.readFile(this.statsPath, 'utf-8')
      this.stats = JSON.parse(content)
    } catch {
      // Stats don't exist, use defaults
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await fs.writeFile(this.statsPath, JSON.stringify(this.stats, null, 2))
    } catch (error) {
      console.warn('Failed to save cache stats:', error)
    }
  }

  private updateStats(): void {
    this.stats.totalEntries = Object.keys(this.index.entries).length
    this.stats.totalSize = this.index.totalSize
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0
    
    // Save stats asynchronously
    this.saveStats().catch(() => {})
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled) return

    try {
      await fs.rm(this.config.directory, { recursive: true, force: true })
      
      this.index = {
        entries: {},
        totalSize: 0,
        lastCleanup: Date.now()
      }
      
      this.stats = {
        hits: 0,
        misses: 0,
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0
      }
      
      await this.initialize()
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  async printStats(): Promise<void> {
    const stats = this.getStats()
    
    console.log('\n📊 Cache Statistics:')
    console.log(`  Cache enabled: ${this.config.enabled}`)
    console.log(`  Total entries: ${stats.totalEntries}`)
    console.log(`  Total size: ${this.formatSize(stats.totalSize)}`)
    console.log(`  Cache hits: ${stats.hits}`)
    console.log(`  Cache misses: ${stats.misses}`)
    console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
    console.log(`  Max size: ${this.formatSize(this.config.maxSize)}`)
    console.log(`  Max age: ${this.formatDuration(this.config.maxAge)}`)
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  private formatDuration(ms: number): string {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return `${Math.floor(ms / (60 * 1000))}m`
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getConfig(): CacheConfig {
    return { ...this.config }
  }
}