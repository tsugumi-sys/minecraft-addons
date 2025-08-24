# Development Guide

This document provides comprehensive information for developing Minecraft Bedrock Edition addons in this repository.

## Prerequisites

### System Requirements

- Windows 10/11 with WSL (Windows Subsystem for Linux)
- Minecraft Bedrock Edition (UWP version)
- Node.js/JavaScript knowledge for addon development
- Basic bash/shell scripting knowledge for build tools

### Required Tools

Install these tools in your WSL environment:

```bash
# Install zip utility
sudo apt-get install -y zip

# Install jq for JSON parsing (optional but recommended)
sudo apt-get install -y jq
```

## Project Structure

```
minecraft/addons/
├── README.md                 # Main documentation
├── docs/
│   └── DEVELOPMENT.md       # This file
├── build_mcpack.sh          # Build and deployment script
├── create-addon.sh          # Addon creation script
├── capatiator/              # Capacitor addon
│   ├── manifest.json        # Addon metadata
│   └── scripts/
│       └── main.js          # Addon logic
├── productivity/            # Productivity Tracker addon
├── replanting/             # Auto Replanting addon
└── tool-replacement/       # Tool Replacement addon
```

## Creating New Addons

### Using the Creation Script

Use the provided script to create a new addon:

```bash
./create-addon.sh my-new-addon
```

This will:
- Create a new addon directory
- Generate a proper `manifest.json` with unique UUIDs
- Create the basic script structure
- Set up the entry point

### Manual Creation

1. Create a new directory with a descriptive name
2. Create `manifest.json` with proper metadata:

```json
{
    "format_version": 2,
    "header": {
        "name": "Your Addon Name",
        "description": "Your addon description",
        "uuid": "unique-uuid-here",
        "version": [1, 0, 0],
        "min_engine_version": [1, 21, 0]
    },
    "modules": [
        {
            "type": "script",
            "language": "javascript",
            "entry": "scripts/main.js",
            "uuid": "another-unique-uuid",
            "version": [1, 0, 0]
        }
    ],
    "dependencies": [
        {
            "module_name": "@minecraft/server",
            "version": "2.1.0"
        }
    ]
}
```

3. Create `scripts/main.js` with your addon logic

## Build System

### Using build_mcpack.sh

The build script automates packaging and deployment:

```bash
# Basic usage
./build_mcpack.sh addon-name

# With auto-import
AUTO_IMPORT=true ./build_mcpack.sh addon-name

# Custom output directory
OUTPUT_DIR=/path/to/builds ./build_mcpack.sh addon-name
```

### Configuration Options

Set these environment variables:

- `AUTO_IMPORT=true`: Automatically launch Minecraft to import the pack
- `OUTPUT_DIR=/path`: Custom output directory for .mcpack files
- `RSYNC_DELETE=false`: Don't delete existing files when syncing
- `ZIP_NAME_OVERRIDE=name`: Override the output filename
- `WINUSER=username`: Manually specify Windows username

### Build Process

1. **Validation**: Checks addon directory and manifest.json
2. **Packaging**: Creates .mcpack file (zip format)
3. **Auto-detection**: Finds Minecraft UWP package directory
4. **Deployment**: Syncs to development behavior packs folder
5. **Import** (optional): Launches .mcpack for import

## Development Workflow

### 1. Setup

```bash
# Clone and navigate to project
cd minecraft/addons

# Make scripts executable
chmod +x build_mcpack.sh create-addon.sh
```

### 2. Create New Addon

```bash
# Create addon structure
./create-addon.sh my-addon

# Edit the addon files
code my-addon/scripts/main.js
```

### 3. Development Cycle

```bash
# Build and deploy
./build_mcpack.sh my-addon

# Test in Minecraft
# 1. Launch Minecraft
# 2. Create/edit world
# 3. Enable behavior pack in settings
# 4. Test functionality

# Make changes and rebuild
./build_mcpack.sh my-addon
```

### 4. Testing

- Always test addons in a creative world first
- Create backup saves before testing
- Test with different game versions if targeting multiple versions
- Verify addon works in multiplayer if applicable

## Minecraft Bedrock Scripting

### Core APIs

The addons use the `@minecraft/server` API. Key modules:

- `world`: Access to the game world
- `Player`: Player-specific functionality
- `Block`: Block manipulation
- `Entity`: Entity interactions
- `ItemStack`: Inventory management

### Common Patterns

#### Event Handling

```javascript
import { world } from '@minecraft/server';

// Block break event
world.beforeEvents.playerBreakBlock.subscribe((event) => {
    // Handle block break
});

// Player spawn event
world.afterEvents.playerSpawn.subscribe((event) => {
    // Handle player spawn
});
```

#### Block Manipulation

```javascript
// Get block at position
const block = world.getDimension('overworld').getBlock(location);

// Set block type
block.setType('minecraft:air');

// Check block type
if (block.typeId === 'minecraft:oak_log') {
    // Handle oak log
}
```

#### Player Interactions

```javascript
// Get player inventory
const inventory = player.getComponent('inventory');

// Check if player is sneaking
if (player.isSneaking) {
    // Handle sneaking behavior
}

// Send message to player
player.sendMessage('Hello from addon!');
```

## Best Practices

### Code Organization

- Keep related functionality in separate files
- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent coding style

### Performance

- Avoid expensive operations in frequent events
- Use early returns to minimize processing
- Implement safeguards (like maximum block limits)
- Cache frequently accessed data

### Error Handling

```javascript
try {
    // Risky operation
    block.setType('minecraft:air');
} catch (error) {
    console.warn('Failed to set block:', error);
}
```

### UUID Management

- Generate unique UUIDs for each addon and module
- Use online UUID generators or `uuidgen` command
- Never reuse UUIDs between different addons

## Debugging

### Console Logging

```javascript
console.log('Debug info:', value);
console.warn('Warning:', issue);
console.error('Error:', error);
```

### Content Log

Check Minecraft's content log for script errors:
- Windows: `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\logs\`

### Common Issues

1. **Script not loading**: Check manifest.json syntax
2. **Permission errors**: Verify WSL can access Windows directories
3. **UUID conflicts**: Ensure all UUIDs are unique
4. **Version compatibility**: Check min_engine_version requirements

## Deployment

### Local Testing

- Use development behavior packs folder
- Enable "Holiday Creator Features" in world settings
- Enable "Additional Modding Capabilities" if needed

### Distribution

- Create .mcpack files for easy sharing
- Test on clean Minecraft installation
- Provide clear installation instructions
- Include version compatibility information

## Contributing

When contributing to this repository:

1. Follow the established project structure
2. Test thoroughly using the build script
3. Update documentation as needed
4. Use descriptive commit messages
5. Ensure code follows project conventions

## Resources

- [Minecraft Bedrock Documentation](https://docs.microsoft.com/en-us/minecraft/creator/)
- [Minecraft Script API Reference](https://docs.microsoft.com/en-us/minecraft/creator/scriptapi/)
- [Bedrock Wiki](https://wiki.bedrock.dev/)
- [UUID Generator](https://www.uuidgenerator.net/)