import { EquipmentSlot, system, world } from "@minecraft/server";

const TOOL_TYPES = [
	"minecraft:wooden_sword",
	"minecraft:stone_sword",
	"minecraft:iron_sword",
	"minecraft:golden_sword",
	"minecraft:diamond_sword",
	"minecraft:netherite_sword",
	"minecraft:wooden_axe",
	"minecraft:stone_axe",
	"minecraft:iron_axe",
	"minecraft:golden_axe",
	"minecraft:diamond_axe",
	"minecraft:netherite_axe",
	"minecraft:wooden_pickaxe",
	"minecraft:stone_pickaxe",
	"minecraft:iron_pickaxe",
	"minecraft:golden_pickaxe",
	"minecraft:diamond_pickaxe",
	"minecraft:netherite_pickaxe",
	"minecraft:wooden_shovel",
	"minecraft:stone_shovel",
	"minecraft:iron_shovel",
	"minecraft:golden_shovel",
	"minecraft:diamond_shovel",
	"minecraft:netherite_shovel",
	"minecraft:wooden_hoe",
	"minecraft:stone_hoe",
	"minecraft:iron_hoe",
	"minecraft:golden_hoe",
	"minecraft:diamond_hoe",
	"minecraft:netherite_hoe",
	"minecraft:bow",
	"minecraft:crossbow",
	"minecraft:trident",
	"minecraft:fishing_rod",
	"minecraft:flint_and_steel",
	"minecraft:shears",
];

function findReplacementTool(player, brokenToolType) {
	const inventory = player.getComponent("inventory").container;

	for (let i = 0; i < inventory.size; i++) {
		const item = inventory.getItem(i);
		if (item && item.typeId === brokenToolType) {
			return { item, slot: i };
		}
	}
	return null;
}

function replaceTool(player, replacementInfo) {
	try {
		const inventory = player.getComponent("inventory").container;
		const equippable = player.getComponent("equippable");

		const newTool = replacementInfo.item.clone();
		inventory.setItem(replacementInfo.slot, undefined);
		equippable.setEquipment(EquipmentSlot.Mainhand, newTool);

		player.sendMessage(
			"§a道具を自動的に持ち替えました！ / Tool automatically replaced!",
		);
	} catch (error) {
		console.warn("Tool replacement failed:", error);
	}
}

world.beforeEvents.itemUse.subscribe((eventData) => {
	const player = eventData.source;
	const item = eventData.itemStack;

	if (!TOOL_TYPES.includes(item.typeId)) {
		return;
	}

	const durabilityComponent = item.getComponent("durability");
	if (!durabilityComponent) {
		return;
	}

	if (durabilityComponent.damage >= durabilityComponent.maxDurability - 1) {
		system.run(() => {
			const replacementTool = findReplacementTool(player, item.typeId);
			if (replacementTool) {
				replaceTool(player, replacementTool);
			}
		});
	}
});
