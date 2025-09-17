/**
 * TypeScript wrapper for Kokoro TTS engine with enhanced type safety
 */

import { KokoroTTS } from 'kokoro-js';
import type { 
  ModelOptions, 
  GenerationOptions, 
  StreamingOptions, 
  VoiceId, 
  AudioMetadata, 
  StreamChunk,
  PerformanceMetrics
} from './types.js';
import { VOICES, getVoiceInfo } from './voices.js';

export class TypedKokoroTTS {
  private model: any; // KokoroTTS instance
  private tokenizer: any;
  private isInitialized = false;
  private modelOptions: ModelOptions;

  constructor(model: any, tokenizer: any, options: ModelOptions) {
    this.model = model;
    this.tokenizer = tokenizer;
    this.modelOptions = options;
    this.isInitialized = true;
  }

  /**
   * Initialize the TTS model with type-safe options
   */
  static async fromPretrained(
    modelId: string = 'onnx-community/Kokoro-82M-v1.0-ONNX',
    options: ModelOptions = {}
  ): Promise<TypedKokoroTTS> {
    const defaultOptions: ModelOptions = {
      dtype: 'q8',
      device: 'cpu',
      ...options
    };

    const startTime = Date.now();
    
    try {
      const tts = await KokoroTTS.from_pretrained(modelId, {
        dtype: defaultOptions.dtype,
        device: defaultOptions.device,
        progress_callback: defaultOptions.progress_callback as any
      });

      const loadTime = Date.now() - startTime;
      console.log(`✅ Model loaded in ${(loadTime / 1000).toFixed(2)}s`);

      return new TypedKokoroTTS(tts.model, tts.tokenizer, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to load TTS model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate voice ID
   */
  private validateVoice(voice: VoiceId): void {
    if (!VOICES[voice]) {
      const availableVoices = Object.keys(VOICES).join(', ');
      throw new Error(`Invalid voice "${voice}". Available voices: ${availableVoices}`);
    }
  }

  /**
   * Validate generation options
   */
  private validateOptions(options: GenerationOptions): void {
    if (options.voice) {
      this.validateVoice(options.voice);
    }

    if (options.speed !== undefined) {
      if (options.speed < 0.5 || options.speed > 2.0) {
        throw new Error(`Speed must be between 0.5 and 2.0, got: ${options.speed}`);
      }
    }

    if (options.temperature !== undefined) {
      if (options.temperature < 0.1 || options.temperature > 1.0) {
        throw new Error(`Temperature must be between 0.1 and 1.0, got: ${options.temperature}`);
      }
    }
  }

  /**
   * Generate speech from text with type-safe options
   */
  async generate(
    text: string,
    options: GenerationOptions = {}
  ): Promise<{ audio: any; metadata: AudioMetadata }> {
    if (!this.isInitialized) {
      throw new Error('TTS model not initialized');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    this.validateOptions(options);

    const startTime = Date.now();
    
    const generationOptions = {
      voice: options.voice || 'af_sarah',
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7,
      ...options
    };

    try {
      // Create the KokoroTTS instance wrapper if needed
      const ttsWrapper = {
        model: this.model,
        tokenizer: this.tokenizer,
        generate: async (text: string, opts: any) => {
          // Call the actual generate method from kokoro-js
          const kokoro = new KokoroTTS(this.model, this.tokenizer);
          return await kokoro.generate(text, opts);
        }
      };

      const audio = await ttsWrapper.generate(text, generationOptions);
      
      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;
      
      // Simplified metadata - kokoro-js audio object structure varies
      const metadata: AudioMetadata = {
        duration: 0, // Audio duration not easily accessible
        sampleRate: 22050, // Default sample rate for Kokoro
        samples: 0, // Sample count not easily accessible
        generationTime,
        realTimeFactor: 0 // Will be 0 since duration is unknown
      };

      return { audio, metadata };
    } catch (error) {
      throw new Error(`Speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate speech with streaming
   */
  async* generateStream(
    text: string,
    options: StreamingOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isInitialized) {
      throw new Error('TTS model not initialized');
    }

    this.validateOptions(options);

    const streamingOptions = {
      voice: options.voice || 'af_sarah',
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7,
      split_pattern: options.split_pattern,
      ...options
    };

    try {
      // Create the KokoroTTS instance wrapper for streaming
      const kokoro = new KokoroTTS(this.model, this.tokenizer);
      
      for await (const chunk of kokoro.stream(text, streamingOptions)) {
        yield {
          text: chunk.text,
          phonemes: chunk.phonemes,
          audio: chunk.audio
        };
      }
    } catch (error) {
      throw new Error(`Streaming generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available voices with metadata
   */
  getVoices() {
    return VOICES;
  }

  /**
   * List voices in a formatted way
   */
  listVoices(): void {
    console.log('\n🎭 Available Kokoro TTS Voices:');
    console.log('═══════════════════════════════');
    
    Object.entries(VOICES).forEach(([id, info]) => {
      const gradeEmoji = info.overallGrade.startsWith('A') ? '🌟' : 
                        info.overallGrade.startsWith('B') ? '⭐' :
                        info.overallGrade.startsWith('C') ? '📊' : '📉';
      
      console.log(`${gradeEmoji} ${id.padEnd(15)} - ${info.name} (${info.language.toUpperCase()}, ${info.gender})`);
      console.log(`    Grade: ${info.overallGrade} | ${info.description}`);
      if (info.traits) {
        console.log(`    Traits: ${info.traits}`);
      }
      console.log('');
    });
  }

  /**
   * Get voice information
   */
  getVoiceInfo(voiceId: VoiceId) {
    return getVoiceInfo(voiceId);
  }

  /**
   * Get model configuration
   */
  getModelInfo() {
    return {
      device: this.modelOptions.device,
      dtype: this.modelOptions.dtype,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Benchmark voice performance
   */
  async benchmarkVoice(
    voiceId: VoiceId, 
    testText = "Performance testing with different voice configurations."
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage().heapUsed;

    try {
      const result = await this.generate(testText, { voice: voiceId });
      
      const endTime = Date.now();
      const memoryAfter = process.memoryUsage().heapUsed;

      return {
        modelLoadTime: 0, // Already loaded
        textProcessingTime: 0, // Included in generation
        audioGenerationTime: result.metadata.generationTime,
        totalTime: (endTime - startTime) / 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          peak: memoryAfter
        }
      };
    } catch (error) {
      throw new Error(`Benchmark failed for voice ${voiceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate text input
   */
  validateText(text: string, maxLength = 10000): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('Text cannot be empty');
    }

    if (text.length > maxLength) {
      errors.push(`Text exceeds maximum length of ${maxLength} characters`);
    }

    // Check for potentially problematic characters
    const problematicChars = text.match(/[^\x00-\x7F\u00A0-\u024F\u1E00-\u1EFF]/g);
    if (problematicChars) {
      errors.push(`Text contains potentially unsupported characters: ${[...new Set(problematicChars)].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate generation time based on text length and voice
   */
  estimateGenerationTime(text: string, voice: VoiceId = 'af_sarah'): number {
    // Rough estimation based on text length and voice quality
    const baseTimePerChar = 0.01; // seconds per character
    const voiceInfo = this.getVoiceInfo(voice);
    
    // Higher quality voices might take slightly longer
    const qualityMultiplier = voiceInfo.overallGrade.startsWith('A') ? 1.2 :
                             voiceInfo.overallGrade.startsWith('B') ? 1.1 : 1.0;
    
    return text.length * baseTimePerChar * qualityMultiplier;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.isInitialized = false;
    // Additional cleanup if needed
  }
}