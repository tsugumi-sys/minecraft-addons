import { system, world } from "@minecraft/server";

// Language Configuration
const LANGUAGE = "ja"; // Change to 'en' for English

// Language texts
const texts = {
	en: {
		sessionStats: "SESSION STATS",
		distance: "Distance",
		blocks: "blocks",
		blocksbroken: "Blocks Broken",
		blocksplaced: "Blocks Placed",
	},
	ja: {
		sessionStats: "セッション活動量",
		distance: "移動距離",
		blocks: "ブロック",
		blocksbroken: "破壊ブロック",
		blocksplaced: "設置ブロック",
	},
};

// Function to get text by key
function getText(key) {
	return texts[LANGUAGE][key] || texts.en[key] || key;
}

const INTERVAL_SEC = 1;
const DISTANCE_REPORT_INTERVAL_SEC = 60 * 5;

const playerData = new Map();

function calculateDistance(pos1, pos2) {
	const dx = pos1.x - pos2.x;
	const dy = pos1.y - pos2.y;
	const dz = pos1.z - pos2.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
	const player = event.player;
	const playerId = player.id;

	if (!playerData.has(playerId)) {
		playerData.set(playerId, {
			lastLocation: player.location,
			sessionDistance: 0,
			lastReportTime: Date.now(),
			blocksBreakCount: 0,
			blocksPlacedCount: 0,
		});
	}

	const data = playerData.get(playerId);
	data.blocksBreakCount++;
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
	const player = event.player;
	const playerId = player.id;

	if (!playerData.has(playerId)) {
		playerData.set(playerId, {
			lastLocation: player.location,
			sessionDistance: 0,
			lastReportTime: Date.now(),
			blocksBreakCount: 0,
			blocksPlacedCount: 0,
		});
	}

	const data = playerData.get(playerId);
	data.blocksPlacedCount++;
});

system.runInterval(() => {
	const players = world.getAllPlayers();

	for (const player of players) {
		const currentLocation = player.location;
		const playerId = player.id;

		if (!playerData.has(playerId)) {
			playerData.set(playerId, {
				lastLocation: currentLocation,
				sessionDistance: 0,
				lastReportTime: Date.now(),
				blocksBreakCount: 0,
				blocksPlacedCount: 0,
			});
		} else {
			const data = playerData.get(playerId);
			const distance = calculateDistance(currentLocation, data.lastLocation);
			data.sessionDistance += distance;
			data.lastLocation = currentLocation;
		}
	}
}, INTERVAL_SEC * 20);

system.runInterval(() => {
	const players = world.getAllPlayers();

	for (const player of players) {
		const playerId = player.id;
		const data = playerData.get(playerId);

		if (data) {
			const distanceRounded = Math.round(data.sessionDistance * 100) / 100;

			player.sendMessage(`=== ${getText("sessionStats")} ===`);
			player.sendMessage(
				`§f${getText("distance")}: ${distanceRounded} ${getText("blocks")}`,
			);
			player.sendMessage(
				`§f${getText("blocksbroken")}: ${data.blocksBreakCount}`,
			);
			player.sendMessage(
				`§f${getText("blocksplaced")}: ${data.blocksPlacedCount}`,
			);
		}
	}
}, DISTANCE_REPORT_INTERVAL_SEC * 20);
