import { ItemStack, system, world } from "@minecraft/server";

// Language Configuration
const LANGUAGE = "ja"; // Change to 'ja' for Japanese

// Language texts
const texts = {
	en: {
		woodCapacitor: "Wood Capacitor",
		oreCapacitor: "Ore Capacitor",
		cropCapacitor: "Crop Capacitor",
		activated: "activated! Breaking",
		blocks: "blocks",
		dropped: "Dropped",
		blocksAtLocation: "blocks at location!",
		errorDropping: "Error dropping items:",
		warning: "Warning:",
		blocksCouldntBeBroken: "blocks couldn't be broken due to errors.",
		error: "error:",
	},
	ja: {
		woodCapacitor: "木こり",
		oreCapacitor: "鉱石採掘",
		cropCapacitor: "作物採取",
		activated: "発動",
		blocks: "個",
		dropped: "ドロップ",
		blocksAtLocation: "個とれた",
		errorDropping: "アイテムドロップエラー:",
		warning: "警告:",
		blocksCouldntBeBroken: "ブロックがエラーにより破壊できませんでした。",
		error: "エラー:",
	},
};

// Function to get text by key
function getText(key) {
	return texts[LANGUAGE][key] || texts.en[key] || key;
}

// Configuration
const MAX_BLOCKS = 100;

// Abstract Capacitor class
class Capacitor {
	constructor(
		blockTypes,
		toolTypes,
		maxBlocks = MAX_BLOCKS,
		name = "Capacitor",
	) {
		this.blockTypes = blockTypes;
		this.toolTypes = toolTypes;
		this.maxBlocks = maxBlocks;
		this.name = name;
	}

	isValidBlock(blockTypeId) {
		// biome-ignore lint/suspicious/noPrototypeBuiltins: too anying
		return this.blockTypes.hasOwnProperty(blockTypeId);
	}

	getDropItem(blockTypeId) {
		return this.blockTypes[blockTypeId];
	}

	isValidTool(toolTypeId) {
		return this.toolTypes.includes(toolTypeId);
	}

	findConnectedBlocks(dimension, startLocation, blockType) {
		const visited = new Set();
		const blocks = [];
		const queue = [startLocation];

		while (queue.length > 0 && blocks.length < this.maxBlocks) {
			const location = queue.shift();
			const key = `${location.x},${location.y},${location.z}`;

			if (visited.has(key)) continue;
			visited.add(key);

			try {
				const block = dimension.getBlock(location);

				if (block && this.getDropItem(block.typeId) === blockType) {
					blocks.push({
						location: { ...location },
						block: block,
					});

					for (let dx = -1; dx <= 1; dx++) {
						for (let dy = -1; dy <= 1; dy++) {
							for (let dz = -1; dz <= 1; dz++) {
								if (dx === 0 && dy === 0 && dz === 0) continue;

								const newLoc = {
									x: location.x + dx,
									y: location.y + dy,
									z: location.z + dz,
								};

								const newKey = `${newLoc.x},${newLoc.y},${newLoc.z}`;
								if (!visited.has(newKey)) {
									queue.push(newLoc);
								}
							}
						}
					}
				}
			} catch (error) {
				console.warn(
					`Failed to access block at ${location.x},${location.y},${location.z}: ${error.message}`,
				);
			}
		}

		return blocks;
	}

	dropItems(dimension, location, itemType, amount) {
		while (amount > 0) {
			const stackSize = Math.min(amount, 64);
			const itemStack = new ItemStack(itemType, stackSize);
			dimension.spawnItem(itemStack, location);
			amount -= stackSize;
		}
	}

	isHoldingValidTool(player) {
		try {
			const inventory = player.getComponent("inventory");
			const container = inventory.container;
			const selectedSlot = player.selectedSlotIndex;
			const heldItem = container.getItem(selectedSlot);

			return heldItem && this.isValidTool(heldItem.typeId);
		} catch (error) {
			console.warn(`Failed to check player's held item: ${error.message}`);
			return false;
		}
	}

	activate(event) {
		const { block, player } = event;

		try {
			if (
				this.isValidBlock(block.typeId) &&
				player.isSneaking &&
				this.isHoldingValidTool(player)
			) {
				const dropItemType = this.getDropItem(block.typeId);
				const dimension = player.dimension;

				const connectedBlocks = this.findConnectedBlocks(
					dimension,
					block.location,
					dropItemType,
				);

				if (connectedBlocks.length > 1) {
					if (LANGUAGE === "ja") {
						player.sendMessage(
							`${this.name}${getText("activated")} ${connectedBlocks.length}${getText("blocks")}...`,
						);
					} else {
						player.sendMessage(
							`${this.name} ${getText("activated")} ${connectedBlocks.length} ${getText("blocks")}...`,
						);
					}

					let totalBlocksBroken = 0;
					let errorCount = 0;

					system.runTimeout(() => {
						for (let i = 1; i < connectedBlocks.length; i++) {
							const { location } = connectedBlocks[i];

							try {
								const blockToBreak = dimension.getBlock(location);
								if (blockToBreak && this.isValidBlock(blockToBreak.typeId)) {
									dimension.setBlockType(location, "minecraft:air");
									totalBlocksBroken++;
								}
							} catch (error) {
								errorCount++;
								console.warn(
									`Failed to break block at ${location.x},${location.y},${location.z}: ${error.message}`,
								);
							}
						}

						if (totalBlocksBroken > 0) {
							try {
								this.dropItems(
									dimension,
									block.location,
									dropItemType,
									totalBlocksBroken,
								);
								if (LANGUAGE === "ja") {
									player.sendMessage(
										`${totalBlocksBroken + 1}${getText("blocksAtLocation")}`,
									);
								} else {
									player.sendMessage(
										`${getText("dropped")} ${totalBlocksBroken + 1} ${getText("blocksAtLocation")}`,
									);
								}
							} catch (error) {
								player.sendMessage(
									`${getText("errorDropping")} ${error.message}`,
								);
							}
						}

						if (errorCount > 0) {
							player.sendMessage(
								`${getText("warning")} ${errorCount} ${getText("blocksCouldntBeBroken")}`,
							);
						}
					}, 1);
				}
			}
		} catch (error) {
			player.sendMessage(`${this.name} ${getText("error")} ${error.message}`);
			console.error(`${this.name} failed: ${error.message}`);
		}
	}
}

// Wood Capacitor
class WoodCapacitor extends Capacitor {
	constructor() {
		const woodTypes = {
			"minecraft:oak_log": "minecraft:oak_log",
			"minecraft:birch_log": "minecraft:birch_log",
			"minecraft:spruce_log": "minecraft:spruce_log",
			"minecraft:jungle_log": "minecraft:jungle_log",
			"minecraft:acacia_log": "minecraft:acacia_log",
			"minecraft:dark_oak_log": "minecraft:dark_oak_log",
			"minecraft:mangrove_log": "minecraft:mangrove_log",
			"minecraft:cherry_log": "minecraft:cherry_log",
			"minecraft:oak_wood": "minecraft:oak_log",
			"minecraft:birch_wood": "minecraft:birch_log",
			"minecraft:spruce_wood": "minecraft:spruce_log",
			"minecraft:jungle_wood": "minecraft:jungle_log",
			"minecraft:acacia_wood": "minecraft:acacia_log",
			"minecraft:dark_oak_wood": "minecraft:dark_oak_log",
			"minecraft:mangrove_wood": "minecraft:mangrove_log",
			"minecraft:cherry_wood": "minecraft:cherry_log",
		};

		const axeTypes = [
			"minecraft:wooden_axe",
			"minecraft:stone_axe",
			"minecraft:iron_axe",
			"minecraft:golden_axe",
			"minecraft:diamond_axe",
			"minecraft:netherite_axe",
		];

		super(woodTypes, axeTypes, MAX_BLOCKS, getText("woodCapacitor"));
	}
}

// Ore Capacitor
class OreCapacitor extends Capacitor {
	constructor() {
		const oreTypes = {
			"minecraft:coal_ore": "minecraft:coal",
			"minecraft:deepslate_coal_ore": "minecraft:coal",
			"minecraft:iron_ore": "minecraft:raw_iron",
			"minecraft:deepslate_iron_ore": "minecraft:raw_iron",
			"minecraft:copper_ore": "minecraft:raw_copper",
			"minecraft:deepslate_copper_ore": "minecraft:raw_copper",
			"minecraft:gold_ore": "minecraft:raw_gold",
			"minecraft:deepslate_gold_ore": "minecraft:raw_gold",
			"minecraft:redstone_ore": "minecraft:redstone",
			"minecraft:deepslate_redstone_ore": "minecraft:redstone",
			"minecraft:lapis_ore": "minecraft:lapis_lazuli",
			"minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
			"minecraft:diamond_ore": "minecraft:diamond",
			"minecraft:deepslate_diamond_ore": "minecraft:diamond",
			"minecraft:emerald_ore": "minecraft:emerald",
			"minecraft:deepslate_emerald_ore": "minecraft:emerald",
			"minecraft:nether_quartz_ore": "minecraft:quartz",
			"minecraft:nether_gold_ore": "minecraft:gold_nugget",
			"minecraft:ancient_debris": "minecraft:netherite_scrap",
		};

		const pickaxeTypes = [
			"minecraft:wooden_pickaxe",
			"minecraft:stone_pickaxe",
			"minecraft:iron_pickaxe",
			"minecraft:golden_pickaxe",
			"minecraft:diamond_pickaxe",
			"minecraft:netherite_pickaxe",
		];

		super(oreTypes, pickaxeTypes, MAX_BLOCKS, getText("oreCapacitor"));
	}
}

// Crop Capacitor
class CropCapacitor extends Capacitor {
	constructor() {
		const cropTypes = {
			"minecraft:wheat": "minecraft:wheat",
			"minecraft:carrots": "minecraft:carrot",
			"minecraft:potatoes": "minecraft:potato",
			"minecraft:beetroots": "minecraft:beetroot",
			"minecraft:nether_wart": "minecraft:nether_wart",
			"minecraft:sweet_berry_bush": "minecraft:sweet_berries",
			"minecraft:cocoa": "minecraft:cocoa_beans",
			"minecraft:melon": "minecraft:melon_slice",
			"minecraft:pumpkin": "minecraft:pumpkin",
			"minecraft:sugar_cane": "minecraft:sugar_cane",
			"minecraft:bamboo": "minecraft:bamboo",
			"minecraft:kelp": "minecraft:kelp",
			"minecraft:sea_pickle": "minecraft:sea_pickle",
		};

		const hoeTypes = [
			"minecraft:wooden_hoe",
			"minecraft:stone_hoe",
			"minecraft:iron_hoe",
			"minecraft:golden_hoe",
			"minecraft:diamond_hoe",
			"minecraft:netherite_hoe",
		];

		super(cropTypes, hoeTypes, MAX_BLOCKS, getText("cropCapacitor"));
	}

	isValidBlock(blockTypeId) {
		return this.blockTypes.hasOwnProperty(blockTypeId);
	}

	findConnectedBlocks(dimension, startLocation, blockType) {
		const visited = new Set();
		const blocks = [];
		const queue = [startLocation];

		while (queue.length > 0 && blocks.length < this.maxBlocks) {
			const location = queue.shift();
			const key = `${location.x},${location.y},${location.z}`;

			if (visited.has(key)) continue;
			visited.add(key);

			try {
				const block = dimension.getBlock(location);

				if (block && this.isValidBlock(block.typeId)) {
					blocks.push({
						location: { ...location },
						block: block,
					});

					for (let dx = -1; dx <= 1; dx++) {
						for (let dz = -1; dz <= 1; dz++) {
							if (dx === 0 && dz === 0) continue;

							const newLoc = {
								x: location.x + dx,
								y: location.y,
								z: location.z + dz,
							};

							const newKey = `${newLoc.x},${newLoc.y},${newLoc.z}`;
							if (!visited.has(newKey)) {
								queue.push(newLoc);
							}
						}
					}
				}
			} catch (error) {
				console.warn(
					`Failed to access block at ${location.x},${location.y},${location.z}: ${error.message}`,
				);
			}
		}

		return blocks;
	}
}

// Create capacitor instances
const woodCapacitor = new WoodCapacitor();
const oreCapacitor = new OreCapacitor();
const cropCapacitor = new CropCapacitor();

// Array of all capacitors
const capacitors = [woodCapacitor, oreCapacitor, cropCapacitor];

// Listen for block break events
world.beforeEvents.playerBreakBlock.subscribe((event) => {
	// Try each capacitor to see if it can handle this block
	for (const capacitor of capacitors) {
		capacitor.activate(event);
	}
});
