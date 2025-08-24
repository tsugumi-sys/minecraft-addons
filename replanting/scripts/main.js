import { ItemStack, system, world } from "@minecraft/server";

// Language Configuration
const LANGUAGE = "ja"; // Change to 'ja' for Japanese

// Language texts
const texts = {
	en: {
		replanted: "Replanted",
		cropReplanted: "crop replanted!",
		treeReplanted: "sapling planted!",
		wheat: "wheat",
		carrots: "carrots",
		potatoes: "potatoes",
		beetroots: "beetroots",
		nether_wart: "nether wart",
		sweet_berry_bush: "sweet berry bush",
		cocoa: "cocoa",
		oak_sapling: "oak sapling",
		birch_sapling: "birch sapling",
		spruce_sapling: "spruce sapling",
		jungle_sapling: "jungle sapling",
		acacia_sapling: "acacia sapling",
		dark_oak_sapling: "dark oak sapling",
		mangrove_propagule: "mangrove propagule",
		cherry_sapling: "cherry sapling"
	},
	ja: {
		replanted: "再植栽",
		cropReplanted: "を植え直しました！",
		treeReplanted: "を植えました！",
		wheat: "小麦",
		carrots: "ニンジン",
		potatoes: "ジャガイモ",
		beetroots: "ビートルート",
		nether_wart: "ネザーウォート",
		sweet_berry_bush: "スイートベリー",
		cocoa: "ココア",
		oak_sapling: "オークの苗木",
		birch_sapling: "シラカバの苗木",
		spruce_sapling: "トウヒの苗木",
		jungle_sapling: "ジャングルの苗木",
		acacia_sapling: "アカシアの苗木",
		dark_oak_sapling: "ダークオークの苗木",
		mangrove_propagule: "マングローブの胎生種子",
		cherry_sapling: "サクラの苗木"
	},
};

// Function to get text by key
function getText(key) {
	return texts[LANGUAGE][key] || texts.en[key] || key;
}

// Configuration
const REPLANT_DELAY_TICKS = 40; // 2 seconds delay (20 ticks = 1 second)

const REPLANT_CONFIG = {
    crops: {
        "minecraft:wheat": {
            seedItem: "minecraft:wheat_seeds",
            matureAge: 7,
            farmlandRequired: true
        },
        "minecraft:carrots": {
            seedItem: "minecraft:carrot",
            matureAge: 7,
            farmlandRequired: true
        },
        "minecraft:potatoes": {
            seedItem: "minecraft:potato",
            matureAge: 7,
            farmlandRequired: true
        },
        "minecraft:beetroots": {
            seedItem: "minecraft:beetroot_seeds",
            matureAge: 3,
            farmlandRequired: true
        },
        "minecraft:nether_wart": {
            seedItem: "minecraft:nether_wart",
            matureAge: 3,
            farmlandRequired: false
        },
        "minecraft:sweet_berry_bush": {
            seedItem: "minecraft:sweet_berries",
            matureAge: 3,
            farmlandRequired: false
        },
        "minecraft:cocoa": {
            seedItem: "minecraft:cocoa_beans",
            matureAge: 2,
            farmlandRequired: false
        }
    },
    trees: {
        "minecraft:oak_log": {
            saplingItem: "minecraft:oak_sapling"
        },
        "minecraft:birch_log": {
            saplingItem: "minecraft:birch_sapling"
        },
        "minecraft:spruce_log": {
            saplingItem: "minecraft:spruce_sapling"
        },
        "minecraft:jungle_log": {
            saplingItem: "minecraft:jungle_sapling"
        },
        "minecraft:acacia_log": {
            saplingItem: "minecraft:acacia_sapling"
        },
        "minecraft:dark_oak_log": {
            saplingItem: "minecraft:dark_oak_sapling"
        },
        "minecraft:mangrove_log": {
            saplingItem: "minecraft:mangrove_propagule"
        },
        "minecraft:cherry_log": {
            saplingItem: "minecraft:cherry_sapling"
        }
    }
};

class ReplantingSystem {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        world.afterEvents.playerBreakBlock.subscribe((event) => {
            this.handleBlockBreak(event);
        });
    }

    handleBlockBreak(event) {
        const { block, player, brokenBlockPermutation } = event;
        
        if (!player || !brokenBlockPermutation) return;

        const blockTypeId = brokenBlockPermutation.type.id;
        
        if (this.isMatureCrop(blockTypeId, brokenBlockPermutation)) {
            this.handleCropReplant(block, player, blockTypeId, brokenBlockPermutation);
        } else if (this.isTreeLog(blockTypeId)) {
            this.handleTreeReplant(block, player, blockTypeId);
        }
    }

    isMatureCrop(blockTypeId, permutation) {
        const cropConfig = REPLANT_CONFIG.crops[blockTypeId];
        if (!cropConfig) return false;

        const growthState = permutation.getState("growth") || permutation.getState("age");
        return growthState >= cropConfig.matureAge;
    }

    isTreeLog(blockTypeId) {
        return REPLANT_CONFIG.trees.hasOwnProperty(blockTypeId);
    }

    handleCropReplant(block, player, blockTypeId, brokenBlockPermutation) {
        const cropConfig = REPLANT_CONFIG.crops[blockTypeId];
        if (!cropConfig) return;

        const seedItem = this.findItemInInventory(player, cropConfig.seedItem);
        if (!seedItem) return;

        system.runTimeout(() => {
            try {
                const currentBlock = block.dimension.getBlock(block.location);
                if (!currentBlock || currentBlock.typeId !== "minecraft:air") return;

                if (cropConfig.farmlandRequired) {
                    const belowBlock = block.dimension.getBlock({
                        x: block.location.x,
                        y: block.location.y - 1,
                        z: block.location.z
                    });
                    
                    if (!belowBlock || belowBlock.typeId !== "minecraft:farmland") return;
                }

                const newPermutation = block.dimension.getBlockType(blockTypeId).createDefaultBlockPermutation();
                if (newPermutation.getState("growth") !== undefined) {
                    newPermutation.setState("growth", 0);
                } else if (newPermutation.getState("age") !== undefined) {
                    newPermutation.setState("age", 0);
                }

                block.dimension.setBlockPermutation(block.location, newPermutation);
                this.consumeItemFromInventory(player, cropConfig.seedItem, 1);
                
                const cropName = getText(blockTypeId.replace("minecraft:", ""));
                if (LANGUAGE === "ja") {
                    player.sendMessage(`§a${cropName}${getText("cropReplanted")}`);
                } else {
                    player.sendMessage(`§a${getText("replanted")} ${cropName} ${getText("cropReplanted")}`);
                }
            } catch (error) {
                console.warn(`Failed to replant crop: ${error.message}`);
            }
        }, REPLANT_DELAY_TICKS);
    }

    handleTreeReplant(block, player, blockTypeId) {
        const treeConfig = REPLANT_CONFIG.trees[blockTypeId];
        if (!treeConfig) return;

        const saplingItem = this.findItemInInventory(player, treeConfig.saplingItem);
        if (!saplingItem) return;

        const groundBlock = this.findGroundForSapling(block);
        if (!groundBlock) return;

        system.runTimeout(() => {
            try {
                const saplingLocation = {
                    x: groundBlock.x,
                    y: groundBlock.y + 1,
                    z: groundBlock.z
                };

                const airBlock = block.dimension.getBlock(saplingLocation);
                if (!airBlock || airBlock.typeId !== "minecraft:air") return;

                block.dimension.setBlockType(saplingLocation, treeConfig.saplingItem);
                this.consumeItemFromInventory(player, treeConfig.saplingItem, 1);
                
                const saplingName = getText(treeConfig.saplingItem.replace("minecraft:", ""));
                if (LANGUAGE === "ja") {
                    player.sendMessage(`§a${saplingName}${getText("treeReplanted")}`);
                } else {
                    player.sendMessage(`§a${getText("replanted")} ${saplingName} ${getText("treeReplanted")}`);
                }
            } catch (error) {
                console.warn(`Failed to replant tree: ${error.message}`);
            }
        }, REPLANT_DELAY_TICKS);
    }

    findGroundForSapling(brokenBlock) {
        const { dimension, location } = brokenBlock;
        
        for (let y = location.y; y >= location.y - 10; y--) {
            try {
                const checkLocation = { x: location.x, y: y, z: location.z };
                const groundBlock = dimension.getBlock(checkLocation);
                
                if (groundBlock && this.isValidSaplingGround(groundBlock.typeId)) {
                    const aboveLocation = { x: location.x, y: y + 1, z: location.z };
                    const aboveBlock = dimension.getBlock(aboveLocation);
                    
                    if (aboveBlock && aboveBlock.typeId === "minecraft:air") {
                        return checkLocation;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }

    isValidSaplingGround(blockTypeId) {
        const validGround = [
            "minecraft:dirt",
            "minecraft:grass_block",
            "minecraft:coarse_dirt",
            "minecraft:podzol",
            "minecraft:rooted_dirt",
            "minecraft:moss_block",
            "minecraft:mycelium"
        ];
        
        return validGround.includes(blockTypeId);
    }

    findItemInInventory(player, itemTypeId) {
        try {
            const inventory = player.getComponent("inventory");
            if (!inventory) return null;

            const container = inventory.container;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item && item.typeId === itemTypeId && item.amount > 0) {
                    return item;
                }
            }
        } catch (error) {
            console.warn(`Failed to check inventory: ${error.message}`);
        }
        
        return null;
    }

    consumeItemFromInventory(player, itemTypeId, amount) {
        try {
            const inventory = player.getComponent("inventory");
            if (!inventory) return false;

            const container = inventory.container;
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (item && item.typeId === itemTypeId && item.amount >= amount) {
                    if (item.amount === amount) {
                        container.setItem(i, undefined);
                    } else {
                        const newItem = new ItemStack(itemTypeId, item.amount - amount);
                        container.setItem(i, newItem);
                    }
                    return true;
                }
            }
        } catch (error) {
            console.warn(`Failed to consume item: ${error.message}`);
        }
        
        return false;
    }
}

// Initialize the replanting system
const replantingSystem = new ReplantingSystem();