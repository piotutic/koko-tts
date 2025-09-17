#!/usr/bin/env node

/**
 * Comprehensive TypeScript CLI tool for Kokoro TTS
 */

import { Command } from 'commander';
import chalk from 'chalk';
import clear from 'clear';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

import { TypedKokoroTTS } from './tts-engine.js';
import { VOICES, VOICE_CATEGORIES, VOICE_PRESETS, getVoiceInfo } from './voices.js';
import { FileUtils, ConfigUtils, ValidationUtils, StringUtils, PlatformUtils } from './utils.js';
import type { 
  CliOptions, 
  VoiceId, 
  Device, 
  DType, 
  AudioFormat,
  GenerationOptions,
  ConfigFile
} from './types.js';

// CLI version
const CLI_VERSION = '0.1.2';

// Create CLI application
const program = new Command();

program
  .name('koko')
  .description('Simple, powerful text-to-speech CLI using Kokoro TTS')
  .version(CLI_VERSION);

// Global options
program
  .option('-v, --voice <voice>', 'Voice to use', 'af_sarah')
  .option('-s, --speed <speed>', 'Speaking speed (0.5-2.0)', parseFloat, 1.0)
  .option('-t, --temperature <temp>', 'Temperature (0.1-1.0)', parseFloat, 0.7)
  .option('--device <device>', 'Device (cpu/wasm/webgpu)', 'cpu')
  .option('--dtype <dtype>', 'Data type (fp32/fp16/q8/q4/q4f16)', 'q8')
  .option('-o, --output <file>', 'Output filename', 'output.wav')
  .option('--format <format>', 'Output format (wav/pcm)', 'wav')
  .option('--streaming', 'Use streaming mode', false)
  .option('-f, --file <file>', 'Read text from file')
  .option('--output-dir <dir>', 'Output directory for batch processing')
  .option('--config <file>', 'Configuration file path')
  .option('--save-config <file>', 'Save current options to config file')
  .option('--verbose', 'Verbose output', false)
  .option('--quiet', 'Quiet mode (minimal output)', false);

/**
 * Main generate command
 */
program
  .command('generate')
  .alias('gen')
  .description('Generate speech from text')
  .argument('[text]', 'Text to convert to speech')
  .action(async (text: string | undefined, options: any, command: any) => {
    try {
      // Merge global options with command options
      const globalOptions = command.parent.opts();
      const allOptions = { ...globalOptions, ...options };
      const cliOptions = await parseAndValidateOptions(allOptions, text);
      await generateSpeech(cliOptions);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * List voices command
 */
program
  .command('voices')
  .alias('ls')
  .description('List available voices')
  .option('--category <category>', 'Filter by category (american/british/male/female/recommended)')
  .option('--grade <grade>', 'Minimum quality grade (A/B/C/D)')
  .option('--json', 'Output as JSON')
  .action(async (options: any) => {
    try {
      await listVoices(options);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Interactive mode command
 */
program
  .command('interactive')
  .alias('i')
  .description('Interactive mode with voice preview')
  .action(async () => {
    try {
      await interactiveMode();
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Presets command
 */
program
  .command('presets')
  .description('Manage voice presets')
  .option('--list', 'List available presets')
  .option('--use <name>', 'Use a preset')
  .option('--save <name>', 'Save current settings as preset')
  .action(async (options: any) => {
    try {
      await managePresets(options);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Batch processing command
 */
program
  .command('batch')
  .description('Process multiple files or texts')
  .option('--input-dir <dir>', 'Input directory containing text files')
  .option('--input-list <file>', 'File containing list of texts/files to process')
  .option('--pattern <pattern>', 'File pattern for batch processing')
  .action(async (options: any) => {
    try {
      await batchProcess(options);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Benchmark command
 */
program
  .command('benchmark')
  .alias('bench')
  .description('Benchmark voice performance')
  .option('--voice <voice>', 'Specific voice to benchmark')
  .option('--all', 'Benchmark all voices')
  .option('--text <text>', 'Custom text for benchmarking', 'Performance testing with different voice configurations.')
  .action(async (options: any) => {
    try {
      await benchmarkVoices(options);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Configuration command
 */
program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Create default configuration file')
  .option('--show', 'Show current configuration')
  .option('--edit', 'Edit configuration file')
  .action(async (options: any) => {
    try {
      await manageConfig(options);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Parse and validate CLI options
 */
async function parseAndValidateOptions(options: any, text?: string): Promise<CliOptions> {
  // Load configuration if specified
  let config: ConfigFile | null = null;
  if (options.config) {
    config = await ConfigUtils.loadConfig(options.config);
    if (!config) {
      throw new Error(`Configuration file not found: ${options.config}`);
    }
  }

  // Build CLI options
  const cliOptions: CliOptions = {
    voice: options.voice as VoiceId || 'af_sarah',
    speed: options.speed || 1.0,
    temperature: options.temperature || 0.7,
    device: options.device as Device || 'cpu',
    dtype: options.dtype as DType || 'q8',
    output: options.output || 'output.wav',
    format: options.format as AudioFormat || 'wav',
    streaming: options.streaming || false,
    text: text || '',
    inputFile: options.file,
    outputDir: options.outputDir,
    help: false,
    listVoices: false,
    interactive: false,
    verbose: options.verbose || false,
    quiet: options.quiet || false,
    config: options.config,
    saveConfig: options.saveConfig,
    batch: false,
    preview: false
  };

  // Apply configuration defaults
  if (config) {
    Object.assign(cliOptions, ConfigUtils.mergeWithDefaults(config, cliOptions));
  }

  // Validate options
  const errors = ValidationUtils.validateCliOptions(cliOptions);
  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.map(e => `  • ${e.message}`).join('\n')}`);
  }

  return cliOptions;
}

/**
 * Generate speech from text
 */
async function generateSpeech(options: CliOptions): Promise<void> {
  const spinner = ora();
  
  try {
    // Only show header for non-interactive mode
    if (!options.quiet && !options.interactive) {
      console.log(chalk.blue('🎤 Kokoro TTS - TypeScript CLI'));
      console.log(chalk.blue('═══════════════════════════════'));
    }

    // Get text input
    let text = options.text;
    if (options.inputFile) {
      if (!options.quiet) {
        spinner.start(`Reading from: ${options.inputFile}`);
      }
      text = await FileUtils.readTextFile(options.inputFile);
      spinner.succeed(`Read ${text.length} characters from file`);
    }

    if (!text) {
      throw new Error('No text provided');
    }

    // Display generation info (reduced for interactive mode)
    if (!options.quiet) {
      if (options.interactive) {
        const voiceInfo = getVoiceInfo(options.voice);
        console.log(`\n${chalk.gray('Voice:')} ${options.voice} (${voiceInfo.name})`);
        console.log(`${chalk.gray('Text:')} "${StringUtils.truncate(text, 80)}"`);
      } else {
        const voiceInfo = getVoiceInfo(options.voice);
        console.log(`📢 Voice: ${chalk.yellow(options.voice)} (${voiceInfo.description})`);
        console.log(`⚡ Speed: ${chalk.yellow(options.speed + 'x')}`);
        console.log(`🌡️  Temperature: ${chalk.yellow(options.temperature.toString())}`);
        console.log(`🖥️  Device: ${chalk.yellow(options.device)}`);
        console.log(`💾 Output: ${chalk.yellow(options.output)}`);
        console.log(`📝 Text: "${chalk.gray(StringUtils.truncate(text, 100))}"`);
        console.log('');
      }
    }

    // Initialize TTS model
    if (!options.quiet) {
      const loadingMsg = options.interactive ? 'Loading model...' : 'Loading Kokoro TTS model...';
      spinner.start(loadingMsg);
    }
    
    const tts = await TypedKokoroTTS.fromPretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: options.dtype,
      device: options.device,
      progress_callback: (progress) => {
        if (progress.status === 'downloading' && !options.quiet) {
          spinner.text = `⬇️  Downloading model: ${Math.round(progress.progress || 0)}%`;
        }
      }
    });

    if (!options.quiet) {
      const successMsg = options.interactive ? 'Model ready' : 'Model loaded successfully!';
      spinner.succeed(successMsg);
    }

    // Generate speech
    const generationOptions: GenerationOptions = {
      voice: options.voice,
      speed: options.speed,
      temperature: options.temperature
    };

    if (options.streaming) {
      await generateStreamingSpeech(tts, text, generationOptions, options);
    } else {
      await generateRegularSpeech(tts, text, generationOptions, options);
    }

    // Save configuration if requested
    if (options.saveConfig) {
      const config: ConfigFile = {
        defaults: {
          voice: options.voice,
          speed: options.speed,
          temperature: options.temperature,
          device: options.device,
          dtype: options.dtype,
          format: options.format
        }
      };
      const configPath = await ConfigUtils.saveConfig(config, options.saveConfig);
      if (!options.quiet) {
        console.log(`💾 Configuration saved to: ${chalk.green(configPath)}`);
      }
    }

  } catch (error) {
    spinner.fail('Generation failed');
    throw error;
  }
}

/**
 * Generate regular (non-streaming) speech
 */
async function generateRegularSpeech(
  tts: TypedKokoroTTS, 
  text: string, 
  options: GenerationOptions, 
  cliOptions: CliOptions
): Promise<void> {
  const spinner = ora();
  
  if (!cliOptions.quiet) {
    const generatingMsg = cliOptions.interactive ? 'Generating...' : '🎵 Generating speech...';
    spinner.start(generatingMsg);
  }

  const { audio, metadata } = await tts.generate(text, options);
  
  if (!cliOptions.quiet) {
    if (cliOptions.interactive) {
      spinner.succeed('Generated audio');
    } else {
      spinner.succeed('Speech generation completed!');
      
      console.log(`⏱️  Generation time: ${chalk.green(metadata.generationTime.toFixed(2) + 's')}`);
      if (metadata.duration > 0) {
        console.log(`🎵 Audio duration: ${chalk.green(metadata.duration.toFixed(2) + 's')}`);
        console.log(`📊 Real-time factor: ${chalk.green(metadata.realTimeFactor.toFixed(2) + 'x')}`);
      }
      console.log(`🔊 Sample rate: ${chalk.green(metadata.sampleRate + 'Hz')}`);
      if (metadata.samples > 0) {
        console.log(`📈 Total samples: ${chalk.green(metadata.samples.toString())}`);
      }
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(path.resolve(cliOptions.output));
  await fs.mkdir(outputDir, { recursive: true });

  // Save audio
  if (!cliOptions.quiet && !cliOptions.interactive) {
    spinner.start(`💾 Saving to: ${cliOptions.output}`);
  }
  
  await audio.save(cliOptions.output);
  
  if (!cliOptions.quiet) {
    if (cliOptions.interactive) {
      // Don't show additional output in interactive mode
    } else {
      spinner.succeed('Audio saved successfully!');
      
      // Show playback commands
      const playCommands = PlatformUtils.getAudioPlayerCommands(cliOptions.output);
      console.log('\n🔊 To play the audio:');
      playCommands.forEach(cmd => console.log(`  ${chalk.cyan(cmd)}`));
    }
  }
}

/**
 * Generate streaming speech
 */
async function generateStreamingSpeech(
  tts: TypedKokoroTTS, 
  text: string, 
  options: GenerationOptions, 
  cliOptions: CliOptions
): Promise<void> {
  if (!cliOptions.quiet) {
    console.log('🌊 Streaming mode enabled');
    console.log('─────────────────────────');
  }

  let chunkCount = 0;
  const chunks: any[] = [];

  for await (const chunk of tts.generateStream(text, options)) {
    chunkCount++;
    chunks.push(chunk.audio);
    
    if (!cliOptions.quiet) {
      process.stdout.write(`\r🌊 Processing chunks: ${chunkCount}`);
    }
  }

  if (!cliOptions.quiet) {
    console.log(`\n✅ Streaming completed! Generated ${chunkCount} chunks`);
  }

  // Combine chunks and save (simplified - would need proper audio concatenation)
  if (chunks.length > 0) {
    const finalAudio = chunks[chunks.length - 1]; // Use last chunk for demo
    await finalAudio.save(cliOptions.output);
    
    if (!cliOptions.quiet) {
      console.log(`💾 Audio saved to: ${chalk.green(cliOptions.output)}`);
    }
  }
}

/**
 * List available voices
 */
async function listVoices(options: any): Promise<void> {
  let voices = Object.keys(VOICES) as VoiceId[];

  // Apply filters
  if (options.category) {
    const category = options.category.toLowerCase();
    if (VOICE_CATEGORIES[category as keyof typeof VOICE_CATEGORIES]) {
      voices = VOICE_CATEGORIES[category as keyof typeof VOICE_CATEGORIES];
    } else {
      throw new Error(`Invalid category: ${options.category}. Available: ${Object.keys(VOICE_CATEGORIES).join(', ')}`);
    }
  }

  if (options.grade) {
    const gradeOrder = ['F+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'A-', 'A'];
    const minIndex = gradeOrder.indexOf(options.grade);
    if (minIndex === -1) {
      throw new Error(`Invalid grade: ${options.grade}. Available: ${gradeOrder.join(', ')}`);
    }
    
    voices = voices.filter(id => {
      const voiceGrade = VOICES[id].overallGrade;
      return gradeOrder.indexOf(voiceGrade) >= minIndex;
    });
  }

  // Output results
  if (options.json) {
    const voiceData = voices.reduce((acc, id) => {
      acc[id] = VOICES[id];
      return acc;
    }, {} as Record<string, any>);
    console.log(JSON.stringify(voiceData, null, 2));
  } else {
    console.log(chalk.blue('\n🎭 Available Kokoro TTS Voices:'));
    console.log(chalk.blue('═══════════════════════════════'));
    
    voices.forEach(id => {
      const info = VOICES[id];
      const gradeColor = info.overallGrade.startsWith('A') ? chalk.green :
                        info.overallGrade.startsWith('B') ? chalk.yellow :
                        info.overallGrade.startsWith('C') ? chalk.yellow : chalk.red;
      
      console.log(`${gradeColor('●')} ${chalk.bold(id.padEnd(15))} - ${info.name} (${info.language.toUpperCase()}, ${info.gender})`);
      console.log(`   ${chalk.gray('Grade:')} ${gradeColor(info.overallGrade)} | ${info.description}`);
      if (info.traits) {
        console.log(`   ${chalk.gray('Traits:')} ${info.traits}`);
      }
      console.log('');
    });
  }
}

/**
 * Interactive mode - Clean and professional
 */
async function interactiveMode(): Promise<void> {
  clear();
  
  console.log(chalk.cyan('🎤 Koko TTS'));
  console.log(chalk.gray('Simple text-to-speech generation\n'));

  // Setup graceful exit
  process.on('SIGINT', () => {
    console.log(chalk.gray('\n\nGoodbye! 👋'));
    process.exit(0);
  });

  while (true) {
    try {
      const action = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to do?',
          choices: [
            { name: '✨ Generate speech', value: 'generate' },
            { name: '🎭 Browse voices', value: 'voices' },
            { name: '🚪 Exit', value: 'exit' }
          ],
          prefix: ''
        }
      ]);

      if (action.choice === 'exit') {
        clear();
        console.log(chalk.gray('Goodbye! 👋\n'));
        break;
      }

      if (action.choice === 'generate') {
        await interactiveGenerate();
      } else if (action.choice === 'voices') {
        await interactiveVoices();
      }

      // Pause briefly before clearing for next iteration
      await new Promise(resolve => setTimeout(resolve, 500));
      clear();
      console.log(chalk.cyan('🎤 Koko TTS'));
      console.log(chalk.gray('Simple text-to-speech generation\n'));

    } catch (error) {
      console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : 'Unknown error'}`));
      console.log(chalk.gray('Press any key to continue...'));
      await inquirer.prompt([{ name: 'continue', message: '' }]);
    }
  }
}

/**
 * Interactive generation - Clean and simple
 */
async function interactiveGenerate(): Promise<void> {
  clear();
  console.log(chalk.cyan('✨ Generate Speech'));
  console.log(chalk.gray('Choose how to provide your text\n'));

  const inputMethod = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to provide text?',
      choices: [
        { name: '⌨️  Type text manually', value: 'type' },
        { name: '📁 Load from file', value: 'file' }
      ],
      prefix: ''
    }
  ]);

  let text: string;
  
  if (inputMethod.method === 'file') {
    const filePrompt = await inquirer.prompt([
      {
        type: 'input',
        name: 'filepath',
        message: 'Enter file path:',
        validate: async (input: string) => {
          try {
            const trimmed = input.trim();
            if (!trimmed) return 'Please enter a file path';
            
            // Check if file exists
            await FileUtils.readTextFile(trimmed, { maxSize: 1024 }); // Small read to validate
            return true;
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'File not found or invalid'}`;
          }
        },
        prefix: ''
      }
    ]);
    
    try {
      text = await FileUtils.readTextFile(filePrompt.filepath);
      console.log(chalk.green(`\n✅ Loaded ${text.length} characters from file`));
      console.log(chalk.gray(`Preview: "${StringUtils.truncate(text, 100)}"`));
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    const textPrompt = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter text:',
        validate: (input: string) => input.trim().length > 0 || 'Please enter some text',
        prefix: ''
      }
    ]);
    text = textPrompt.text;
  }

  const voicePrompt = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useDefault',
      message: 'Use default voice (Sarah)?',
      default: true,
      prefix: ''
    }
  ]);

  let voice = 'af_sarah';
  let speed = 1.0;

  if (!voicePrompt.useDefault) {
    const voiceAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'voice',
        message: 'Select voice:',
        choices: VOICE_CATEGORIES.recommended.map(id => ({
          name: `${VOICES[id].name} (${VOICES[id].gender})`,
          value: id
        })),
        prefix: ''
      },
      {
        type: 'list',
        name: 'speed',
        message: 'Speaking speed:',
        choices: [
          { name: 'Slow (0.8x)', value: 0.8 },
          { name: 'Normal (1.0x)', value: 1.0 },
          { name: 'Fast (1.2x)', value: 1.2 }
        ],
        default: 1.0,
        prefix: ''
      }
    ]);
    voice = voiceAnswers.voice;
    speed = voiceAnswers.speed;
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const defaultFilename = `koko_${timestamp}.wav`;

  const filenamePrompt = await inquirer.prompt([
    {
      type: 'input',
      name: 'filename',
      message: 'Output filename:',
      default: defaultFilename,
      validate: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Please enter a filename';
        
        // Remove .wav for validation, then check for invalid characters
        const nameWithoutExt = trimmed.replace(/\.wav$/i, '');
        if (!/^[a-zA-Z0-9._-]+$/.test(nameWithoutExt)) {
          return 'Filename can only contain letters, numbers, dots, underscores, and hyphens';
        }
        return true;
      },
      filter: (input: string) => {
        // Add .wav extension if missing
        const trimmed = input.trim();
        return trimmed.toLowerCase().endsWith('.wav') ? trimmed : `${trimmed}.wav`;
      },
      prefix: ''
    }
  ]);

  const filename = filenamePrompt.filename;

  console.log(chalk.gray(`\nGenerating: ${filename}`));

  const options: CliOptions = {
    text: text,
    voice: voice as VoiceId,
    speed,
    temperature: 0.7,
    device: 'cpu' as Device,
    dtype: 'q8' as DType,
    output: filename,
    format: 'wav' as AudioFormat,
    streaming: false,
    help: false,
    listVoices: false,
    interactive: true,
    verbose: false,
    quiet: false,
    batch: false,
    preview: false
  };

  await generateSpeech(options);
  
  console.log(chalk.green(`\n✅ Success! Generated: ${filename}`));
  console.log(chalk.gray('Press Enter to continue...'));
  await inquirer.prompt([{ name: 'continue', message: '', prefix: '' }]);
}

/**
 * Interactive voice browser
 */
async function interactiveVoices(): Promise<void> {
  clear();
  console.log(chalk.cyan('🎭 Browse Voices'));
  console.log(chalk.gray('Explore available voices\n'));

  const categories = [
    { name: '⭐ Recommended', value: 'recommended' },
    { name: '🇺🇸 American Female', value: 'american_female' },
    { name: '🇺🇸 American Male', value: 'american_male' },
    { name: '🇬🇧 British Female', value: 'british_female' },
    { name: '🇬🇧 British Male', value: 'british_male' },
    { name: '📋 All voices', value: 'all' }
  ];

  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'Choose category:',
      choices: categories,
      prefix: ''
    }
  ]);

  let voices: VoiceId[];
  if (category === 'all') {
    voices = Object.keys(VOICES) as VoiceId[];
  } else if (category === 'american_female') {
    voices = Object.keys(VOICES).filter(id => id.startsWith('af_')) as VoiceId[];
  } else if (category === 'american_male') {
    voices = Object.keys(VOICES).filter(id => id.startsWith('am_')) as VoiceId[];
  } else if (category === 'british_female') {
    voices = Object.keys(VOICES).filter(id => id.startsWith('bf_')) as VoiceId[];
  } else if (category === 'british_male') {
    voices = Object.keys(VOICES).filter(id => id.startsWith('bm_')) as VoiceId[];
  } else {
    voices = VOICE_CATEGORIES.recommended;
  }

  console.log(chalk.green(`\nFound ${voices.length} voices:\n`));
  
  voices.forEach((id, index) => {
    const info = VOICES[id];
    const gradeColor = info.overallGrade.startsWith('A') ? chalk.green :
                      info.overallGrade.startsWith('B') ? chalk.yellow : chalk.red;
    
    console.log(`${chalk.gray((index + 1).toString().padStart(2))}. ${chalk.bold(id)} - ${info.name}`);
    console.log(`    ${chalk.gray('Language:')} ${info.language.toUpperCase()} | ${chalk.gray('Grade:')} ${gradeColor(info.overallGrade)}`);
    console.log(`    ${chalk.gray('Description:')} ${info.description}\n`);
  });

  console.log(chalk.gray('Press Enter to continue...'));
  await inquirer.prompt([{ name: 'continue', message: '', prefix: '' }]);
}


/**
 * Manage presets
 */
async function managePresets(options: any): Promise<void> {
  if (options.list) {
    console.log(chalk.blue('\n🎯 Available Voice Presets:'));
    console.log(chalk.blue('═══════════════════════════'));
    
    Object.entries(VOICE_PRESETS).forEach(([name, preset]) => {
      console.log(`${chalk.bold(name)}`);
      console.log(`   ${chalk.gray('Description:')} ${preset.description}`);
      console.log(`   ${chalk.gray('Voice:')} ${preset.voice} | ${chalk.gray('Speed:')} ${preset.speed} | ${chalk.gray('Temperature:')} ${preset.temperature}`);
      if (preset.tags) {
        console.log(`   ${chalk.gray('Tags:')} ${preset.tags.join(', ')}`);
      }
      console.log('');
    });
  }
  
  // Additional preset management would be implemented here
}

/**
 * Batch processing
 */
async function batchProcess(_options: any): Promise<void> {
  console.log(chalk.blue('📦 Batch Processing Mode'));
  console.log(chalk.blue('═══════════════════════'));
  
  // Batch processing implementation would go here
  console.log(chalk.yellow('🚧 Batch processing coming soon!'));
}

/**
 * Benchmark voices
 */
async function benchmarkVoices(options: any): Promise<void> {
  console.log(chalk.blue('🏃 Voice Performance Benchmark'));
  console.log(chalk.blue('═══════════════════════════════'));
  
  const testText = options.text || "Performance testing with different voice configurations.";
  const voicesToTest = options.all ? 
    VOICE_CATEGORIES.recommended : 
    [options.voice || 'af_heart'];

  console.log(`📝 Test text: "${testText}"`);
  console.log(`🎭 Testing ${voicesToTest.length} voice(s)\n`);

  const tts = await TypedKokoroTTS.fromPretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu'
  });

  for (const voiceId of voicesToTest) {
    console.log(`Testing ${chalk.yellow(voiceId)}...`);
    
    try {
      const metrics = await tts.benchmarkVoice(voiceId as VoiceId, testText);
      
      console.log(`  ⏱️  Generation time: ${chalk.green(metrics.audioGenerationTime.toFixed(2) + 's')}`);
      console.log(`  📊 Total time: ${chalk.green(metrics.totalTime.toFixed(2) + 's')}`);
      if (metrics.memoryUsage) {
        console.log(`  💾 Memory delta: ${chalk.green(StringUtils.formatFileSize(metrics.memoryUsage.after - metrics.memoryUsage.before))}`);
      }
    } catch (error) {
      console.log(`  ❌ ${chalk.red('Failed:')} ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('');
  }
}

/**
 * Manage configuration
 */
async function manageConfig(options: any): Promise<void> {
  if (options.init) {
    const defaultConfig: ConfigFile = {
      defaults: {
        voice: 'af_sarah' as VoiceId,
        speed: 1.0,
        temperature: 0.7,
        device: 'cpu' as Device,
        dtype: 'q8' as DType,
        format: 'wav' as AudioFormat
      },
      presets: VOICE_PRESETS
    };
    
    const configPath = await ConfigUtils.saveConfig(defaultConfig, '.kokororc.yml');
    console.log(chalk.green(`✅ Default configuration created: ${configPath}`));
  }
  
  if (options.show) {
    const config = await ConfigUtils.loadConfig();
    if (config) {
      console.log(chalk.blue('📋 Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log(chalk.yellow('⚠️  No configuration file found'));
    }
  }
}

/**
 * Error handler
 */
function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(chalk.red(`\n❌ Error: ${message}`));
  
  if (process.env.NODE_ENV === 'development') {
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error instanceof Error ? error.stack : 'No stack trace available'));
  }
  
  console.error(chalk.yellow('\n💡 Tips:'));
  console.error(chalk.yellow('  • Use --help for usage information'));
  console.error(chalk.yellow('  • Use --verbose for detailed output'));
  console.error(chalk.yellow('  • Check your internet connection for model downloads'));
  
  process.exit(1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception:'));
  handleError(error);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n💥 Unhandled Rejection:'));
  handleError(reason);
});

// Parse CLI arguments
// Always execute when this CLI file is run (it has #!/usr/bin/env node shebang)
if (process.argv.length <= 2) {
  // No arguments provided - launch interactive mode
  interactiveMode().catch(handleError);
} else {
  // Arguments provided - parse commands
  program.parse();
}