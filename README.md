# Minecraft Bedrock Addons

This repository contains Minecraft Bedrock Edition addons and development tools for creating and testing behavior packs on WSL (Windows Subsystem for Linux).

## Current Addons

| Addon Name | English Description | Japanese Description |
|------------|-------------------|---------------------|
| Capacitor | Cut down entire trees, blocks and crops while sneaking | - |
| Productivity Tracker | Track harvested items, movement distance, and display session productivity metrics | - |
| Auto Replanting | Automatically replant crops and trees when broken if seeds/saplings are in inventory | - |
| Tool Replacement | Automatically replaces broken tools with the same tool from inventory | 道具が壊れると、自動的に同じ道具に持ち替える |

## Development Tools

### build_mcpack.sh

A comprehensive build script for packaging and deploying Bedrock addons from WSL.

#### Features

- **Auto-packaging**: Creates `.mcpack` files from addon directories
- **Auto-deployment**: Syncs addon to Minecraft's development behavior packs folder
- **Auto-detection**: Automatically finds the correct Minecraft UWP installation
- **Auto-import**: Optionally launches Minecraft to import the pack

#### Usage

Basic usage:
```bash
./build_mcpack.sh tree-capatiator
```

With environment variables:
```bash
# Auto-import the pack after building
AUTO_IMPORT=true ./build_mcpack.sh tree-capatiator

# Custom output directory
OUTPUT_DIR=/path/to/builds ./build_mcpack.sh tree-capatiator

# Custom Windows username (if auto-detection fails)
WINUSER=yourusername ./build_mcpack.sh tree-capatiator
```

#### Configuration Options

Set these as environment variables:

- `AUTO_IMPORT=true`: Automatically launch Minecraft to import the pack
- `OUTPUT_DIR=/path/to/builds`: Custom output directory for .mcpack files
- `RSYNC_DELETE=false`: Don't delete existing files when syncing (default: true)
- `ZIP_NAME_OVERRIDE=customname`: Override the output filename
- `WINUSER=username`: Manually specify Windows username

#### Prerequisites

- WSL with bash
- `zip` command (`sudo apt-get install -y zip` if missing)
- `jq` command for parsing manifest.json (optional, `sudo apt-get install -y jq`)
- Minecraft Bedrock Edition (UWP) installed on Windows
- Minecraft must have been launched at least once to create the necessary directories

#### How It Works

1. **Validation**: Checks that the addon directory and manifest.json exist
2. **Packaging**: Creates a .mcpack file (zip format) containing the addon
3. **Auto-detection**: Finds the correct Minecraft UWP package directory
4. **Deployment**: Syncs the addon to the development behavior packs folder
5. **Import** (optional): Launches the .mcpack file to import into Minecraft

## Getting Started

1. Clone this repository to your WSL environment
2. Make the build script executable: `chmod +x build_mcpack.sh`
3. Build and test an addon: `./build_mcpack.sh tree-capatiator`
4. In Minecraft, create or edit a world and enable the behavior pack in settings
5. Test the addon in-game

## File Structure

```
minecraft/addons/
├── README.md                 # This file
├── build_mcpack.sh          # Build and deployment script
└── tree-capatiator/         # Tree Capacitor addon
    ├── manifest.json        # Addon metadata
    └── scripts/
        └── main.js          # Addon logic
```

## Contributing

When creating new addons:

1. Create a new directory with a descriptive name
2. Include a proper `manifest.json` with correct metadata
3. Test thoroughly using the build script
4. Update this README with addon information

## Requirements

- Windows 10/11 with WSL
- Minecraft Bedrock Edition (UWP version)
- Node.js/JavaScript knowledge for addon development
- Basic bash/shell scripting knowledge for build tools

## License

This project is provided as-is for educational and development purposes.