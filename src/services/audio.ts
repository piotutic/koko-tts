/**
 * Audio processing service
 */

import fs from 'fs/promises'
import path from 'path'
import { VoiceId, GenerationOptions, AudioMetadata } from '../types.js'
import { TypedKokoroTTS } from '../tts-engine.js'
import { CacheService } from './cache.js'
import { withNetworkRetry } from '../errors.js'

export interface AudioGenerationResult {
  audioPath: string
  metadata: AudioMetadata
  fromCache: boolean
}

export class AudioService {
  private tts?: TypedKokoroTTS
  private cache?: CacheService

  constructor(cache?: CacheService) {
    this.cache = cache
  }

  async initialize(modelId: string = 'onnx-community/Kokoro-82M-v1.0-ONNX', options: any = {}): Promise<void> {
    this.tts = await withNetworkRetry(() => 
      TypedKokoroTTS.fromPretrained(modelId, options)
    )
  }

  async generateAudio(
    text: string,
    voice: VoiceId,
    outputPath: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<AudioGenerationResult> {
    if (!this.tts) {
      throw new Error('AudioService not initialized. Call initialize() first.')
    }

    // Check cache first
    if (this.cache?.isEnabled()) {
      const cachedPath = await this.cache.get(text, voice, options)
      if (cachedPath) {
        // Copy cached file to desired output location
        await this.ensureOutputDirectory(outputPath)
        await fs.copyFile(cachedPath, outputPath)
        
        return {
          audioPath: outputPath,
          metadata: {
            duration: 0,
            sampleRate: 22050,
            samples: 0,
            generationTime: 0,
            realTimeFactor: 0
          },
          fromCache: true
        }
      }
    }

    // Generate new audio
    const generationOptions = {
      voice,
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7,
      ...options
    }

    const { audio, metadata } = await this.tts.generate(text, generationOptions)
    
    // Ensure output directory exists
    await this.ensureOutputDirectory(outputPath)
    
    // Save audio
    await audio.save(outputPath)

    // Cache the result
    if (this.cache?.isEnabled()) {
      try {
        await this.cache.set(text, voice, outputPath, options)
      } catch (error) {
        // Cache failures shouldn't break audio generation
        console.warn('Failed to cache audio:', error)
      }
    }

    return {
      audioPath: outputPath,
      metadata,
      fromCache: false
    }
  }

  async streamAudio(
    text: string,
    voice: VoiceId,
    outputPath: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<AudioGenerationResult> {
    if (!this.tts) {
      throw new Error('AudioService not initialized. Call initialize() first.')
    }

    const generationOptions = {
      voice,
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7,
      ...options
    }

    const chunks: any[] = []
    
    for await (const chunk of this.tts.generateStream(text, generationOptions)) {
      chunks.push(chunk.audio)
    }

    // For now, just use the last chunk (proper concatenation would be more complex)
    if (chunks.length > 0) {
      await this.ensureOutputDirectory(outputPath)
      const finalAudio = chunks[chunks.length - 1]
      await finalAudio.save(outputPath)
    }

    return {
      audioPath: outputPath,
      metadata: {
        duration: 0,
        sampleRate: 22050,
        samples: 0,
        generationTime: 0,
        realTimeFactor: 0
      },
      fromCache: false
    }
  }

  private async ensureOutputDirectory(outputPath: string): Promise<void> {
    const outputDir = path.dirname(path.resolve(outputPath))
    await fs.mkdir(outputDir, { recursive: true })
  }

  isInitialized(): boolean {
    return !!this.tts
  }

  getCacheStats() {
    return this.cache?.getStats()
  }

  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear()
    }
  }

  dispose(): void {
    this.tts?.dispose()
    this.tts = undefined
  }
}