/**
 * Service factory and exports
 */

export { CacheService } from './cache.js'
export { AudioService } from './audio.js'
export { DirectoryService, getDirectoryService } from './directory.js'

export type { 
  CacheConfig, 
  CacheStats, 
  CacheEntry 
} from './cache.js'

export type { 
  AudioGenerationResult 
} from './audio.js'

export type { 
  DirectoryPaths, 
  SessionInfo 
} from './directory.js'

import { CacheService, CacheConfig } from './cache.js'
import { AudioService } from './audio.js'
import { getDirectoryService } from './directory.js'

// Service factory functions
export function createCacheService(config?: Partial<CacheConfig>): CacheService {
  return new CacheService(config)
}

export function createAudioService(cacheService?: CacheService): AudioService {
  return new AudioService(cacheService)
}

// Combined service initialization
export async function initializeServices(config?: {
  cache?: Partial<CacheConfig>
  model?: {
    id?: string
    options?: any
  }
  directory?: {
    root?: string
    migrate?: boolean
  }
}): Promise<{
  audioService: AudioService
  cacheService?: CacheService
  directoryService: any
}> {
  // Initialize directory service first
  const directoryService = getDirectoryService(config?.directory?.root)
  await directoryService.ensureDirectories()
  
  // Auto-migrate from legacy directories if requested
  if (config?.directory?.migrate !== false) {
    const migrationResults = await directoryService.migrateFromLegacy()
    if (migrationResults.config || migrationResults.cache) {
      console.log(`📦 Migrated to .koko-tts directory: ${migrationResults.config ? 'config' : ''} ${migrationResults.cache ? 'cache' : ''}`.trim())
    }
  }
  
  // Clean up old temp files
  await directoryService.cleanupTempFiles()
  
  let cacheService: CacheService | undefined
  
  // Initialize cache if enabled
  if (config?.cache?.enabled !== false) {
    cacheService = createCacheService(config?.cache)
    await cacheService.initialize()
  }

  // Initialize audio service
  const audioService = createAudioService(cacheService)
  
  if (config?.model) {
    await audioService.initialize(
      config.model.id || 'onnx-community/Kokoro-82M-v1.0-ONNX',
      config.model.options || {}
    )
  }

  return {
    audioService,
    cacheService,
    directoryService
  }
}