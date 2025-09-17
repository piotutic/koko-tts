# Changelog

All notable changes to the Koko TTS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-17

### Added

#### 🎤 Interactive Mode

- **Default Interactive Mode**: Just run `koko` to launch the interactive interface
- **Clean UI**: Professional, minimal interface with screen clearing
- **Smart Workflow**: Guided experience from text input to audio generation
- **File Input Support**: Choose between typing text or loading from files
- **Voice Browser**: Explore available voices by category
- **Filename Customization**: Custom output names or smart auto-generated timestamps

#### 🚀 CLI Features

- **28 Professional Voices**: High-quality American and British English voices
- **Multiple Input Methods**: Direct text, file input (`--file`), interactive mode
- **Voice Control**: Adjustable speed (0.5-2.0x) and temperature (0.1-1.0)
- **Multiple Formats**: WAV and PCM output support
- **Streaming Mode**: Real-time generation for long texts
- **Smart Defaults**: Zero configuration required

#### 🛠️ Developer Experience

- **TypeScript**: Full type safety and modern development
- **Nix Development**: Reproducible development environment
- **Comprehensive CLI**: Help system, voice listing, configuration management
- **Error Handling**: Graceful error management with helpful messages

#### 📁 Project Structure

- **Clean Architecture**: Modular TypeScript codebase
- **Professional Packaging**: Ready for npm publication
- **Documentation**: Comprehensive README with examples
- **Testing**: Built-in validation and error handling

### Technical Details

#### Dependencies

- **Kokoro JS**: v1.0.0 - Core TTS engine
- **Commander**: v12.0.0 - CLI framework
- **Inquirer**: v9.2.0 - Interactive prompts
- **Chalk**: v5.3.0 - Terminal styling
- **Ora**: v8.0.0 - Elegant spinners

#### Voice Categories

- **Recommended**: `af_heart`, `af_bella`, `bf_emma`, `am_michael`, `bm_george`
- **American Female**: 11 voices (af\_\*)
- **American Male**: 9 voices (am\_\*)
- **British Female**: 4 voices (bf\_\*)
- **British Male**: 4 voices (bm\_\*)

#### Performance

- **Model**: Kokoro-82M-v1.0-ONNX (~100MB download on first run)
- **Quality Grades**: A+ to D+ voice quality ratings
- **Generation Speed**: Typically 1-5 seconds per sentence
- **File Support**: Up to 10MB text files, common formats (.txt, .md, .json, .csv)

### Usage Examples

```bash
# Interactive mode (default)
koko

# Command line generation
koko generate "Hello world"
koko generate --file story.txt --voice af_heart

# Voice exploration
koko voices --category recommended

# Advanced usage
koko generate "Custom speech" --speed 0.8 --temperature 0.9 --output presentation.wav
```

### System Requirements

- **Node.js**: 18.0.0 or higher
- **Platform**: Linux, macOS, Windows
- **Internet**: Required for initial model download
- **Storage**: ~200MB for models and dependencies

---

## How to Upgrade

```bash
# Update to latest version
npm update -g koko-tts

# Or reinstall
npm uninstall -g koko-tts
npm install -g koko-tts@latest
```

## Contributing

See [README.md](README.md) for development setup and contribution guidelines.

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.
