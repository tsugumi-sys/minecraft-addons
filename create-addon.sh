#!/bin/bash

# Script to create new Minecraft addon project template with UUID generation

# Function to generate UUID v4
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen
    else
      echo 'Failed to create uuid with uuidgen command.'
      exit 1
    fi
}

# Check if addon name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <addon-name> [description]"
    echo "Example: $0 my-awesome-addon 'This is my awesome addon'"
    exit 1
fi

ADDON_NAME="$1"
DESCRIPTION="${2:-A new Minecraft addon}"

# Validate addon name (no spaces, special characters)
if [[ ! "$ADDON_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: Addon name can only contain letters, numbers, hyphens, and underscores"
    exit 1
fi

# Check if directory already exists
if [ -d "$ADDON_NAME" ]; then
    echo "Error: Directory '$ADDON_NAME' already exists"
    exit 1
fi

echo "Creating new addon: $ADDON_NAME"

# Create addon directory structure
mkdir -p "$ADDON_NAME/scripts"

# Generate UUIDs
HEADER_UUID=$(generate_uuid)
MODULE_UUID=$(generate_uuid)

echo "Generated UUIDs:"
echo "  Header UUID: $HEADER_UUID"
echo "  Module UUID: $MODULE_UUID"

# Create manifest.json
cat > "$ADDON_NAME/manifest.json" << EOF
{
	"format_version": 2,
	"header": {
		"name": "$ADDON_NAME",
		"description": "$DESCRIPTION",
		"uuid": "$HEADER_UUID",
		"version": [1, 0, 0],
		"min_engine_version": [1, 21, 0]
	},
	"modules": [
		{
			"type": "script",
			"language": "javascript",
			"entry": "scripts/main.js",
			"uuid": "$MODULE_UUID",
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
EOF

# Create basic main.js template
cat > "$ADDON_NAME/scripts/main.js" << 'EOF'
import { world } from "@minecraft/server";

// Addon initialization
console.log("Addon loaded successfully!");

// Example: Listen for player join events
world.afterEvents.playerSpawn.subscribe((event) => {
    const { player, initialSpawn } = event;
    
    if (initialSpawn) {
        player.sendMessage("Welcome to the server!");
    }
});

// Example: Listen for chat events
world.beforeEvents.chatSend.subscribe((event) => {
    const { sender, message } = event;
    
    // Example command handling
    if (message.startsWith("!hello")) {
        event.cancel = true;
        sender.sendMessage("Hello there!");
    }
});

// Add your addon logic here...
EOF

echo ""
echo "✅ Addon '$ADDON_NAME' created successfully!"
echo ""
echo "Directory structure:"
echo "  $ADDON_NAME/"
echo "  ├── manifest.json"
echo "  └── scripts/"
echo "      └── main.js"
echo ""
echo "Next steps:"
echo "1. Edit $ADDON_NAME/scripts/main.js to add your addon logic"
echo "2. Test your addon in Minecraft"
echo "3. Use ./build_mcpack.sh $ADDON_NAME to create an .mcpack file"
