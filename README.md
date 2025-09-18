# 🎤 Koko TTS - Kokoro Text-to-Speech CLI

A simple, powerful command-line tool for text-to-speech generation using the Kokoro TTS engine. Convert text to natural-sounding speech with 28+ professional voices.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange.svg)](LICENSE)

## ✨ Features

- 🎯 **28 Professional Voices** with quality grades (American & British English)
- 🚀 **Interactive Mode** - Just run `koko` for a clean, guided experience
- 📁 **File Input** - Process text files via CLI or interactive mode
- 🎛️ **Voice Control** - Choose speed, temperature, and voice
- 📦 **Zero Config** - Works out of the box
- 🌊 **Streaming** - Real-time generation for long texts
- 💾 **Multiple Formats** - WAV and PCM output
- 🔄 **Auto-Chunking** - Bypass 25-second limit with automatic text splitting

## 🚀 Quick Start

### Interactive Mode (Easiest)

```bash
# Using npx (no installation needed)
npx koko-tts@latest

# Or install globally first
npm install -g koko-tts
koko

# Clean, guided interface:
# 🎤 Koko TTS
# Simple text-to-speech generation
#
# What would you like to do?
# ❯ ✨ Generate speech
#   🎭 Browse voices
#   🚪 Exit
```

### Command Line (For Scripts & Automation)

```bash
# Generate speech instantly
npx koko-tts@latest generate "Hello, this is Koko TTS!"

# With specific voice
npx koko-tts@latest generate "Welcome to Koko!" --voice af_heart

# From a text file
npx koko-tts@latest generate --file story.txt --voice bf_emma
```

### Using Nix (Recommended for Development)

```bash
# Clone and enter development environment
git clone <your-repo-url>
cd kokoro-tts-typescript
nix develop

# Build and use
npm run build
koko generate "Hello from Nix!"
```

## 📖 Usage

### Basic Commands

```bash
# Simple generation (uses default voice af_sarah)
koko generate "Your text here"

# Choose a specific voice
koko generate "Hello world" --voice af_heart

# Read from file
koko generate --file input.txt --output audiobook.wav

# Adjust speaking speed and expressiveness
koko generate "Custom speech" --speed 0.8 --temperature 0.9

# Quiet mode (minimal output)
koko generate "Silent generation" --quiet
```

### List Available Voices

```bash
# Show all voices
koko voices

# Filter by category
koko voices --category recommended
koko voices --category american
koko voices --category british

# JSON output for scripting
koko voices --json
```

### Interactive Mode

```bash
# Launch interactive interface (default when no arguments)
koko

# Or explicitly
koko interactive

# Interactive features:
# - Choose between typing text or loading from file
# - Smart voice selection with defaults
# - File browser with validation
# - Custom filename or smart auto-naming
# - Clean, professional interface
```

## 🎭 Voice Options

### Recommended Voices (Highest Quality)

| Voice ID | Description | Language | Gender |
|----------|-------------|----------|---------|
| `af_heart` | Warm, expressive ⭐ | US English | Female |
| `af_bella` | Clear, professional ⭐ | US English | Female |
| `bf_emma` | Elegant, refined ⭐ | UK English | Female |
| `am_michael` | Smooth, versatile | US English | Male |
| `bm_george` | Distinguished, clear | UK English | Male |

⭐ = Top quality voices

### Voice Categories

- **American Female**: `af_heart`, `af_bella`, `af_sarah` (default), `af_nicole`, `af_kore`
- **American Male**: `am_michael`, `am_fenrir`, `am_puck`, `am_echo`, `am_eric`
- **British Female**: `bf_emma`, `bf_isabella`, `bf_alice`, `bf_lily`  
- **British Male**: `bm_george`, `bm_fable`, `bm_lewis`, `bm_daniel`

## ⚙️ Options

| Option | Description | Default | Range |
|--------|-------------|---------|-------|
| `--voice` | Voice to use | `af_sarah` | See voice list |
| `--speed` | Speaking speed | `1.0` | `0.5` - `2.0` |
| `--temperature` | Expressiveness | `0.7` | `0.1` - `1.0` |
| `--output` | Output filename | `output.wav` | Any path |
| `--file` | Input text file | - | Any .txt file |
| `--quiet` | Minimal output | `false` | Boolean |
| `--streaming` | Stream long texts | `false` | Boolean |

## 📋 Examples

### Basic Text Generation

```bash
# Simple generation
koko generate "Welcome to Koko TTS!"

# Professional presentation voice
koko generate "Good morning everyone" --voice af_bella --speed 0.9

# Storytelling with British accent
koko generate "Once upon a time..." --voice bf_emma --temperature 0.8
```

### File Processing

```bash
# Command line file processing
koko generate --file chapter1.txt --voice am_michael --output chapter1.wav

# Interactive file processing
koko
# Choose "✨ Generate speech"
# Choose "📁 Load from file"
# Enter file path with validation

# Batch process with streaming (for long files)
koko generate --file novel.txt --streaming --output audiobook.wav
```

### Interactive Mode Workflow

```bash
# Start interactive mode
koko

# 1. Main Menu
# What would you like to do?
# ❯ ✨ Generate speech
#   🎭 Browse voices  
#   🚪 Exit

# 2. Input Method (when generating speech)
# How would you like to provide text?
# ❯ ⌨️  Type text manually
#   📁 Load from file

# 3. File Input (if file selected)
# Enter file path: story.txt
# ✅ Loaded 1,240 characters from file
# Preview: "Once upon a time in a distant galaxy..."

# 4. Voice Selection
# Use default voice (Sarah)? (Y/n)
# Select voice: Heart (Female) / Michael (Male) / etc.

# 5. Filename Customization
# Output filename: (koko_20250917T143022.wav)
# Press Enter for default or type custom name: my-presentation
# → Uses: my-presentation.wav

# 6. Generation
# Generating: my-presentation.wav
# ✅ Success! Generated: my-presentation.wav
```

### Voice Comparison

```bash
# Test the same text with different voices
koko generate "Voice test" --voice af_heart --output heart.wav
koko generate "Voice test" --voice bf_emma --output emma.wav
koko generate "Voice test" --voice am_michael --output michael.wav
```

### Filename Examples

```bash
# Interactive mode filename options:
# Press Enter → koko_20250917T143022.wav (auto-timestamp)
# Type "presentation" → presentation.wav (auto .wav)
# Type "chapter1.wav" → chapter1.wav (keeps extension)
# Type "audio-notes" → audio-notes.wav (auto .wav)

# Command line (unchanged)
koko generate "text" --output my-custom-name.wav
```

## 🔧 Advanced Usage

### Configuration

```bash
# Initialize configuration file
koko config --init

# Use custom configuration
koko generate "Text" --config my-settings.yml

# Save current settings as preset
koko generate "Test" --voice af_heart --save-config my-preset.yml
```

### Performance & Quality

```bash
# High quality (slower)
koko generate "Text" --dtype fp32

# Balanced quality/speed (default)
koko generate "Text" --dtype q8

# Fast generation (lower quality)
koko generate "Text" --dtype q4
```

## 🏃 Performance Tips

1. **First Run**: Downloads the model (~100MB), subsequent runs are much faster
2. **Voice Selection**: `af_heart` and `af_bella` provide the best quality
3. **Speed Settings**: 0.8-0.9 for presentations, 1.0-1.2 for casual content
4. **Long Texts**: Use `--streaming` for files over 500 characters
5. **File Format**: WAV provides best compatibility

## 📁 Organized Directory Structure

Koko TTS automatically organizes all files in a `.koko-tts/` directory:

```
.koko-tts/
├── config/              # Configuration files
├── cache/               # Audio cache for faster re-generation
├── outputs/             # Generated audio files
│   ├── YYYY-MM-DD/      # CLI outputs by date
│   └── interactive/     # Interactive mode outputs
│       └── YYYY-MM-DD/
└── temp/                # Temporary files (auto-cleaned)
```

**Benefits:**
- Clean workspace (no scattered output files)
- Easy cleanup (delete entire `.koko-tts/` folder)
- Organized by date and generation mode
- Add to `.gitignore`: `echo ".koko-tts/" >> .gitignore`

## 🐛 Troubleshooting

### Common Issues

**Model Download Fails**
```bash
# Check internet connection and retry
koko generate "test" --verbose
```

**Audio File Issues**
```bash
# Verify output file was created
ls -la output.wav

# Test audio playback (Linux)
ffplay output.wav
# or
aplay output.wav
```

**Permission Denied**
```bash
# Ensure CLI has execute permissions
npm run build  # This sets permissions automatically
```

## 📦 Development

### Project Structure

```
src/
├── cli.ts           # Main CLI application
├── tts-engine.ts    # TTS engine wrapper
├── voices.ts        # Voice configurations  
├── types.ts         # TypeScript definitions
└── utils.ts         # Utility functions
```

### Build Commands

```bash
# Build TypeScript
npm run build

# Type checking
npm run type-check

# Clean build files
npm run clean

# Development mode
npm run cli -- generate "dev test"
```

### Adding New Voices

Edit `src/voices.ts` to add new voice configurations with metadata.

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kokoro TTS](https://huggingface.co/hexgrad/Kokoro-82M) - Original model by hexgrad
- [kokoro-js](https://www.npmjs.com/package/kokoro-js) - JavaScript implementation by Xenova
- [Transformers.js](https://huggingface.co/docs/transformers.js) - Machine learning in JavaScript

## 🔗 Links

- [Kokoro TTS Model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)
- [Original kokoro-js Package](https://www.npmjs.com/package/kokoro-js)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Simple, powerful text-to-speech: Just run `koko` for interactive mode or `koko generate "your text"` for command line** 🎤