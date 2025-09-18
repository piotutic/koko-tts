{
  description = "Koko-TTS CLI tool Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};

      koko-tts = pkgs.stdenv.mkDerivation rec {
        pname = "koko-tts";
        version = "0.2.1";

        src = ./.;

        nativeBuildInputs = with pkgs; [
          nodejs_20
          nodePackages.npm
          nodePackages.typescript
        ];

        buildInputs = with pkgs; [
          nodejs_20
        ];

        buildPhase = ''
          export HOME=$TMPDIR
          # Install dependencies
          npm ci --cache $TMPDIR/.npm
          # Build TypeScript
          npm run build
        '';

        installPhase = ''
                      mkdir -p $out/bin $out/lib/node_modules/koko-tts-typescript
                      cp -r . $out/lib/node_modules/koko-tts-typescript/

                      # Create executable scripts for TypeScript compiled output
                      cat > $out/bin/koko-tts << EOF
          #!/usr/bin/env bash
          exec ${pkgs.nodejs_20}/bin/node $out/lib/node_modules/koko-tts-typescript/dist/cli.js "\$@"
          EOF
                      chmod +x $out/bin/koko-tts

                      cat > $out/bin/kokoro-demo << EOF
          #!/usr/bin/env bash
          exec ${pkgs.nodejs_20}/bin/node $out/lib/node_modules/koko-tts-typescript/dist/demo.js "\$@"
          EOF
                      chmod +x $out/bin/kokoro-demo

                      cat > $out/bin/kokoro-streaming << EOF
          #!/usr/bin/env bash
          exec ${pkgs.nodejs_20}/bin/node $out/lib/node_modules/koko-tts-typescript/dist/streaming.js "\$@"
          EOF
                      chmod +x $out/bin/kokoro-streaming
        '';

        meta = with pkgs.lib; {
          description = "TypeScript Text-to-Speech using Kokoro-js with comprehensive CLI";
          license = licenses.asl20;
          maintainers = [];
          platforms = platforms.all;
        };
      };
    in {
      packages = {
        default = koko-tts;
        koko-tts = koko-tts;
      };

      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_20
          nodePackages.npm
          nodePackages.typescript
          nodePackages.ts-node
          ffmpeg
          sox

          # Development tools
          nodePackages.prettier
          nodePackages.eslint
        ];

        shellHook = ''
          echo "🎤 Kokoro TTS TypeScript Development Environment"
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "📦 Node.js version: $(node --version)"
          echo "📦 npm version: $(npm --version)"
          echo "📦 TypeScript version: $(tsc --version)"
          echo ""
          echo "🚀 Available commands:"
          echo "  npm ci              - Install dependencies"
          echo "  npm run build       - Build TypeScript to JavaScript"
          echo "  npm run dev         - Run demo with ts-node"
          echo "  npm run demo        - Run compiled TypeScript demo"
          echo "  npm run streaming   - Run streaming demo"
          echo "  npm run tts         - CLI TTS tool (compiled)"
          echo "  npm run cli         - CLI TTS tool (ts-node)"
          echo "  npm run watch       - Watch mode compilation"
          echo "  npm run type-check  - Type checking only"
          echo "  npm run lint        - Run ESLint"
          echo "  npm run lint:fix    - Auto-fix ESLint issues"
          echo "  npm run format      - Format with Prettier"
          echo ""
          echo "📁 TypeScript project structure:"
          echo "  src/demo.ts         - Main demo application"
          echo "  src/cli.ts          - Comprehensive CLI tool"
          echo "  src/streaming.ts    - Streaming functionality"
          echo "  src/tts-engine.ts   - Typed TTS engine wrapper"
          echo "  src/voices.ts       - Voice configurations"
          echo "  src/types.ts        - TypeScript type definitions"
          echo "  src/utils.ts        - Utility functions"
          echo "  src/services/       - Service layer (cache, audio, directory)"
          echo "  src/errors.ts       - Error handling utilities"
          echo "  dist/               - Compiled JavaScript output"
          echo "  .koko-tts/          - Organized output directory"
          echo ""

          # Ensure node_modules is available
          if [ ! -d "node_modules" ]; then
            echo "📥 Installing dependencies..."
            if [ -f "package-lock.json" ]; then
              echo "Using npm ci (package-lock.json found)"
              npm ci
            else
              echo "Using npm install (creating package-lock.json)"
              npm install
            fi
          fi

          # Build TypeScript if dist doesn't exist
          if [ ! -d "dist" ]; then
            echo "🔨 Building TypeScript..."
            npm run build
          fi

          # Initialize .koko-tts directory structure for development
          if [ ! -d ".koko-tts" ]; then
            echo "📁 Creating .koko-tts directory structure..."
            mkdir -p .koko-tts/{config,cache,outputs,temp}
          fi

          export PATH="$PWD/node_modules/.bin:$PATH"
        '';

        # Environment variables for development
        NODE_ENV = "development";
      };

      # Development shell alias
      devShell = self.devShells.${system}.default;

      # Apps for easy running
      apps = {
        default = {
          type = "app";
          program = "${koko-tts}/bin/kokoro-demo";
        };

        demo = {
          type = "app";
          program = "${koko-tts}/bin/kokoro-demo";
        };

        tts = {
          type = "app";
          program = "${koko-tts}/bin/koko-tts";
        };

        streaming = {
          type = "app";
          program = "${koko-tts}/bin/kokoro-streaming";
        };
      };
    });
}
