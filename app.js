const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  startBtn: document.getElementById("startBtn"),
  audioBtn: document.getElementById("audioBtn"),
  bootScreen: document.getElementById("bootScreen"),
  menuScreen: document.getElementById("menuScreen"),
  worldScreen: document.getElementById("worldScreen"),
  settingsScreen: document.getElementById("settingsScreen"),
  bootFill: document.getElementById("bootFill"),
  bootStatus: document.getElementById("bootStatus"),
  bootPercent: document.getElementById("bootPercent"),
  openWorldBtn: document.getElementById("openWorldBtn"),
  continueBtn: document.getElementById("continueBtn"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  closeWorldBtn: document.getElementById("closeWorldBtn"),
  createWorldBtn: document.getElementById("createWorldBtn"),
  worldNameInput: document.getElementById("worldNameInput"),
  worldSizeSelect: document.getElementById("worldSizeSelect"),
  difficultySelect: document.getElementById("difficultySelect"),
  worldThemeSelect: document.getElementById("worldThemeSelect"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  musicSetting: document.getElementById("musicSetting"),
  mobileControlsSetting: document.getElementById("mobileControlsSetting"),
  weatherSetting: document.getElementById("weatherSetting"),
  healthLabel: document.getElementById("healthLabel"),
  energyLabel: document.getElementById("energyLabel"),
  dayLabel: document.getElementById("dayLabel"),
  modeLabel: document.getElementById("modeLabel"),
  healthFill: document.getElementById("healthFill"),
  energyFill: document.getElementById("energyFill"),
  hotbar: document.getElementById("hotbar"),
  partyLabel: document.getElementById("partyLabel"),
  partyList: document.getElementById("partyList"),
  inventoryList: document.getElementById("inventoryList"),
  selectedItem: document.getElementById("selectedItem"),
  objectiveText: document.getElementById("objectiveText"),
  questList: document.getElementById("questList"),
  weatherLabel: document.getElementById("weatherLabel"),
  eventLog: document.getElementById("eventLog"),
  joystickBase: document.getElementById("joystickBase"),
  joystickKnob: document.getElementById("joystickKnob"),
  mobileActions: document.querySelectorAll("[data-mobile-action]")
};

const state = {
  appScreen: "boot",
  running: false,
  now: performance.now(),
  world: null,
  camera: { x: 0, y: 0 },
  keys: new Set(),
  mobileVector: { x: 0, y: 0 },
  joystick: { active: false, id: null },
  mobileControls: "auto",
  weatherLevel: "full",
  musicEnabled: false,
  audioCtx: null,
  musicNodes: [],
  musicLoop: null,
  screenShake: 0,
  launcher: {
    hasSave: false,
    heroName: "Aru",
    worldSize: "normal",
    difficulty: "adventure",
    theme: "meadow"
  },
  player: null,
  companions: [],
  npcs: [],
  citizens: [],
  vehicles: [],
  trafficLights: [],
  mobs: [],
  fish: [],
  animals: [],
  effects: [],
  quests: [],
  inventoryOpen: true,
  inventory: {
    herb: 3,
    ore: 0,
    shell: 0,
    fish: 0,
    gem: 0,
    parts: 0,
    potion: 1
  },
  hotbar: ["potion", "herb", "ore", "shell", "parts", "gem"],
  selectedSlot: 0,
  log: [],
  worldClock: 0,
  weather: {
    type: "clear",
    rain: 0,
    lightningTimer: 10,
    nextStorm: 45
  },
  interior: null,
  story: {
    active: false,
    index: 0,
    timer: 0,
    autoAdvance: 4.8,
    lines: []
  },
  combo: {
    hits: 0,
    timer: 0
  },
  worldEvent: null,
  vehicleLoop: null,
  crowdLoop: null,
  saveTimer: 0,
  discoveredAreas: {},
  areaBanner: {
    title: "",
    subtitle: "",
    timer: 0
  },
  shop: {
    active: false,
    npcRole: "",
    npcName: "",
    items: [],
    index: 0
  }
};

const AUDIO_FILES = {
  hit: "assets/audio/hit.mp3",
  crowd: "assets/audio/crowd.mp3",
  rain: "assets/audio/rain.mp3",
  "vehicle-bike": "assets/audio/vehicle-bike.mp3",
  "vehicle-car": "assets/audio/vehicle-car.mp3",
  "vehicle-jeep": "assets/audio/vehicle-jeep.mp3",
  "vehicle-hover": "assets/audio/vehicle-hover.mp3",
  "vehicle-boat": "assets/audio/vehicle-boat.mp3"
};

const audioCache = {};
const RETURN_STATE_KEY = "corechiper-return-state";
const SAVE_STATE_KEY = "corechiper-save-state";

const ITEM_LABELS = {
  herb: "Herb",
  ore: "Ore",
  shell: "Shell",
  fish: "Fish",
  gem: "Gem",
  parts: "Parts",
  potion: "Potion",
  gold: "Gold",
  blade: "Blade",
  deed: "House Deed"
};

const characterImages = {
  karakter: new Image(),
  npc1: new Image(),
  npc2: new Image(),
  npc3: new Image(),
  npc4: new Image(),
  npc5: new Image(),
  npc6: new Image(),
  npc7: new Image(),
  npc8: new Image(),
  npc9: new Image(),
  npc10: new Image()
};

characterImages.karakter.src = "assets/characters/karakter.png";
characterImages.npc1.src = "assets/characters/npc1.png";
characterImages.npc2.src = "assets/characters/npc2.png";
characterImages.npc3.src = "assets/characters/npc3.png";
characterImages.npc4.src = "assets/characters/npc4.png";
characterImages.npc5.src = "assets/characters/npc5.png";
characterImages.npc6.src = "assets/characters/npc6.png";
characterImages.npc7.src = "assets/characters/npc7.png";
characterImages.npc8.src = "assets/characters/npc8.png";
characterImages.npc9.src = "assets/characters/npc9.png";
characterImages.npc10.src = "assets/characters/npc10.png";

const vehicleImages = {
  bike: new Image(),
  car: new Image(),
  jeep: new Image(),
  hover: new Image(),
  boat: new Image()
};

vehicleImages.bike.src = "assets/vehicles/bike.png";
vehicleImages.car.src = "assets/vehicles/car.png";
vehicleImages.jeep.src = "assets/vehicles/jeep.png";
vehicleImages.hover.src = "assets/vehicles/hover.png";
vehicleImages.boat.src = "assets/vehicles/boat.png";

const enemyImages = {
  wolf: new Image(),
  raider: new Image(),
  shade: new Image()
};

enemyImages.wolf.src = "assets/enemies/wolf.png";
enemyImages.raider.src = "assets/enemies/raider.png";
enemyImages.shade.src = "assets/enemies/shade.png";

function resizeCanvasToViewport() {
  const width = Math.max(320, Math.round(window.innerWidth || canvas.clientWidth || canvas.width));
  const height = Math.max(320, Math.round(window.innerHeight || canvas.clientHeight || canvas.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function isCompactViewport() {
  return canvas.width < 900 || canvas.height < 620;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, len };
}

function isNight() {
  return state.worldClock >= 120;
}

function getInputVector() {
  if (state.shop.active) return { x: 0, y: 0, len: 0 };
  let x = 0;
  let y = 0;
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) y -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) y += 1;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) x -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) x += 1;
  x += state.mobileVector.x;
  y += state.mobileVector.y;
  const dir = normalize(x, y);
  return dir.len > 0.08 ? dir : { x: 0, y: 0, len: 0 };
}

function showScreen(target) {
  state.appScreen = target;
  ui.bootScreen.classList.toggle("hidden", target !== "boot");
  ui.menuScreen.classList.toggle("hidden", target !== "menu");
  ui.worldScreen.classList.toggle("hidden", target !== "world");
  ui.settingsScreen.classList.toggle("hidden", target !== "settings");
  document.querySelector(".shell").classList.toggle("in-menu", target !== "game");
}

function startBootSequence() {
  showScreen("boot");
  const duration = 10;
  const start = performance.now();
  function tick(now) {
    const progress = clamp((now - start) / (duration * 1000), 0, 1);
    ui.bootFill.style.width = `${Math.floor(progress * 100)}%`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      showScreen("menu");
    }
  }
  requestAnimationFrame(tick);
}

function setReturnState(payload) {
  try {
    localStorage.setItem(RETURN_STATE_KEY, JSON.stringify(payload));
  } catch (error) {
    // ignore storage issues
  }
}

function consumeReturnState() {
  try {
    const raw = localStorage.getItem(RETURN_STATE_KEY);
    if (!raw) return null;
    localStorage.removeItem(RETURN_STATE_KEY);
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function readSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveGameState() {
  if (!state.player || !state.world) return;
  const payload = {
    launcher: state.launcher,
    player: {
      x: state.player.x,
      y: state.player.y,
      health: state.player.health,
      energy: state.player.energy
    },
    inventory: state.inventory,
    selectedSlot: state.selectedSlot,
    worldClock: state.worldClock,
    weather: state.weather,
    quests: state.quests.map((quest) => ({ id: quest.id, done: quest.done, active: quest.active })),
    companions: state.companions.filter((companion) => companion.recruited).map((companion) => companion.name),
    vehicles: state.vehicles.filter((vehicle) => vehicle.owned).map((vehicle) => vehicle.type),
    houses: state.world.houses.map((house) => ({ purchased: !!house.purchased })),
    discoveredAreas: state.discoveredAreas,
    log: state.log.slice(0, 6)
  };
  try {
    localStorage.setItem(SAVE_STATE_KEY, JSON.stringify(payload));
    state.launcher.hasSave = true;
  } catch (error) {
    // ignore storage issues
  }
}

function showAreaBanner(title, subtitle) {
  state.areaBanner.title = title;
  state.areaBanner.subtitle = subtitle;
  state.areaBanner.timer = 3.2;
}

function getShopItems(role) {
  if (role === "dealer") {
    return [
      { id: "jeep", label: "Jeep Urban", price: 180, description: "Kendaraan kuat untuk jalan besar dan area kasar." },
      { id: "car", label: "Mobil Sport", price: 260, description: "Lebih cepat dan stabil untuk kota besar." },
      { id: "boat", label: "Boat Azure", price: 320, description: "Membuka eksplorasi laut dengan aman." },
      { id: "hover", label: "Hover Cart", price: 420, description: "Kendaraan paling premium di darat." }
    ];
  }
  if (role === "smith") {
    return [
      { id: "blade", label: "Royal Blade", price: 140, description: "Pedang kerajaan yang menambah damage." },
      { id: "potion", label: "Potion Pack", price: 40, description: "Tambah 2 potion untuk bertahan lebih lama." },
      { id: "parts", label: "Repair Parts", price: 55, description: "Suku cadang serbaguna untuk craft." }
    ];
  }
  if (role === "realtor") {
    return [
      { id: "deed", label: "House Deed", price: 320, description: "Beli rumah suburb sebagai base pribadi." },
      { id: "furniture", label: "Home Kit", price: 90, description: "Dekor dasar untuk base yang lebih nyaman." }
    ];
  }
  return [];
}

function openShop(npc) {
  state.shop.active = true;
  state.shop.npcRole = npc.role;
  state.shop.npcName = npc.name;
  state.shop.items = getShopItems(npc.role);
  state.shop.index = 0;
  addLog(`${npc.name} membuka toko.`);
}

function closeShop() {
  state.shop.active = false;
  state.shop.npcRole = "";
  state.shop.npcName = "";
  state.shop.items = [];
  state.shop.index = 0;
}

function moveShopSelection(step) {
  if (!state.shop.active || !state.shop.items.length) return;
  const total = state.shop.items.length;
  state.shop.index = (state.shop.index + step + total) % total;
}

function buySelectedShopItem() {
  if (!state.shop.active || !state.shop.items.length) return;
  const item = state.shop.items[state.shop.index];
  if (!item) return;
  if (!canAfford(item.price)) {
    addLog(`Gold belum cukup untuk membeli ${item.label}.`);
    return;
  }

  if (item.id === "jeep" || item.id === "car" || item.id === "boat" || item.id === "hover") {
    const vehicle = state.vehicles.find((entry) => entry.type === item.id);
    if (vehicle?.owned) {
      addLog(`${item.label} sudah kamu miliki.`);
      return;
    }
    spendGold(item.price);
    if (vehicle) vehicle.owned = true;
    addLog(`${item.label} berhasil dibeli.`);
    if (item.id === "jeep") completeQuest("city");
  } else if (item.id === "blade") {
    if (state.inventory.blade) {
      addLog("Royal Blade sudah ada di inventory.");
      return;
    }
    spendGold(item.price);
    state.inventory.blade = 1;
    addLog("Royal Blade berhasil dibeli.");
    completeQuest("blade");
  } else if (item.id === "potion") {
    spendGold(item.price);
    state.inventory.potion = (state.inventory.potion || 0) + 2;
    addLog("Potion Pack dibeli. Potion +2.");
  } else if (item.id === "parts") {
    spendGold(item.price);
    state.inventory.parts = (state.inventory.parts || 0) + 2;
    addLog("Repair Parts dibeli. Parts +2.");
  } else if (item.id === "deed") {
    if (state.inventory.deed) {
      addLog("Kamu sudah punya House Deed.");
      return;
    }
    spendGold(item.price);
    state.inventory.deed = 1;
    const house = state.world.houses.find((entry) => entry.purchasable && !entry.purchased);
    if (house) house.purchased = true;
    addLog("House Deed dibeli. Rumah suburb jadi milikmu.");
  } else if (item.id === "furniture") {
    spendGold(item.price);
    state.inventory.herb = (state.inventory.herb || 0) + 1;
    addLog("Home Kit dibeli. Base terasa lebih hidup.");
  }

  playSfx("quest");
  renderInventory();
  renderHotbar();
  saveGameState();
}

function applySavedGame(savedGame, spawn) {
  if (!savedGame) return;
  state.launcher = { ...state.launcher, ...savedGame.launcher, hasSave: true };
  state.inventory = { ...state.inventory, ...savedGame.inventory };
  state.selectedSlot = savedGame.selectedSlot ?? state.selectedSlot;
  state.worldClock = savedGame.worldClock ?? state.worldClock;
  state.weather = { ...state.weather, ...savedGame.weather };
  state.discoveredAreas = { ...savedGame.discoveredAreas };
  if (savedGame.log?.length) state.log = savedGame.log;

  const questMap = new Map((savedGame.quests || []).map((quest) => [quest.id, quest]));
  state.quests.forEach((quest) => {
    const savedQuest = questMap.get(quest.id);
    if (!savedQuest) return;
    quest.done = !!savedQuest.done;
    quest.active = !!savedQuest.active;
  });

  state.companions.forEach((companion) => {
    companion.recruited = (savedGame.companions || []).includes(companion.name);
  });
  state.vehicles.forEach((vehicle) => {
    vehicle.owned = vehicle.autopilot ? true : (savedGame.vehicles || []).includes(vehicle.type) || vehicle.type === "bike";
  });
  state.world.houses.forEach((house, index) => {
    house.purchased = !!savedGame.houses?.[index]?.purchased;
  });

  if (spawn === "coast" && savedGame.player) {
    state.player.x = savedGame.player.x ?? state.player.x;
    state.player.y = savedGame.player.y ?? state.player.y;
  }
  state.player.health = savedGame.player?.health ?? state.player.health;
  state.player.energy = savedGame.player?.energy ?? state.player.energy;
}

function createWorldModel() {
  const sizeMap = { normal: [6000, 3600], wide: [7600, 4400], massive: [9200, 5200] };
  const [width, height] = sizeMap[state.launcher.worldSize] || sizeMap.normal;
  const oceanWidth = width * 0.22;
  const coastalRoadY = height * 0.56;
  const village = { x: width * 0.25, y: height * 0.18, w: width * 0.16, h: height * 0.18 };
  const villages = [
    village,
    { x: width * 0.34, y: height * 0.68, w: width * 0.15, h: height * 0.15 },
    { x: width * 0.18, y: height * 0.44, w: width * 0.13, h: height * 0.14 },
    { x: width * 0.6, y: height * 0.76, w: width * 0.13, h: height * 0.14 },
    { x: width * 0.73, y: height * 0.62, w: width * 0.12, h: height * 0.13 }
  ];
  const city = { x: width * 0.46, y: height * 0.08, w: width * 0.31, h: height * 0.45 };
  const suburb = { x: width * 0.49, y: height * 0.58, w: width * 0.22, h: height * 0.24 };
  const kingdom = { x: width * 0.81, y: height * 0.1, w: width * 0.15, h: height * 0.3 };
  const harbor = { x: oceanWidth - 140, y: height * 0.62, w: 260, h: 210, type: "harbor" };
  const bunker = { x: city.x - 220, y: city.y + city.h + 80, w: 160, h: 110, label: "Bunker Aegis" };
  const busStop = { x: city.x + city.w + 120, y: city.y + city.h * 0.48, w: 170, h: 76, label: "Bus Metro" };
  const caves = [
    { x: width * 0.58, y: height * 0.16, r: 76, label: "Goa Echo" },
    { x: width * 0.77, y: height * 0.84, r: 88, label: "Goa Ember" }
  ];
  const eventSpots = [
    { x: city.x + city.w * 0.24, y: city.y + city.h * 0.74, w: 260, h: 120, type: "market" },
    { x: city.x + city.w * 0.62, y: city.y + city.h * 0.72, w: 230, h: 120, type: "festival" },
    { x: villages[3].x + 20, y: villages[3].y - 90, w: 180, h: 90, type: "camp" }
  ];
  const interiors = [
    { x: city.x + 68, y: city.y + 96, w: 96, h: 120, district: "city", interiorType: "shop", label: "Dealer Hall", interiorLabel: "Dealer Hall", enterable: true },
    { x: city.x + city.w * 0.66, y: city.y + 112, w: 104, h: 130, district: "city", interiorType: "office", label: "Metro Office", interiorLabel: "Metro Office", enterable: true },
    { x: kingdom.x + 112, y: kingdom.y + 110, w: 112, h: 136, district: "kingdom", interiorType: "armory", label: "Royal Armory", interiorLabel: "Royal Armory", enterable: true },
    { x: kingdom.x + 248, y: kingdom.y + 108, w: 110, h: 136, district: "kingdom", interiorType: "hall", label: "Grand Hall", interiorLabel: "Grand Hall", enterable: true },
    { x: suburb.x + 46, y: suburb.y + 42, w: 112, h: 96, district: "suburb", interiorType: "home", label: "Suburb Home", interiorLabel: "Suburb Home", enterable: true }
  ];

  const makeHouses = (district, area, rows, cols, palette, purchasable = false) => {
    const houses = [];
    const gapX = area.w / (cols + 0.8);
    const gapY = area.h / (rows + 0.6);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const w = 100 + ((row + col) % 3) * 18;
        const h = 82 + ((row + col) % 2) * 18;
        houses.push({
          x: area.x + 26 + col * gapX,
          y: area.y + 26 + row * gapY,
          w,
          h,
          color: palette[(row + col) % palette.length],
          district,
          purchasable: purchasable && row === rows - 1
        });
      }
    }
    return houses;
  };

  const houses = [
    ...makeHouses("village", villages[0], 2, 3, ["#dca464", "#e2bd7c", "#c78d5a"]),
    ...makeHouses("village-2", villages[1], 2, 3, ["#d9a56f", "#bf8759", "#efc386"]),
    ...makeHouses("village-3", villages[2], 2, 2, ["#c88a60", "#e4c18f", "#b97956"]),
    ...makeHouses("village-4", villages[3], 2, 2, ["#bf895f", "#ddb27f", "#c26f53"]),
    ...makeHouses("village-5", villages[4], 2, 2, ["#d39c72", "#f0c48d", "#af7459"]),
    ...makeHouses("suburb", suburb, 2, 4, ["#d2aa7e", "#c88962", "#e1bb91"], true)
  ];
  const trees = Array.from({ length: 320 }, (_, index) => ({
    x: oceanWidth + 120 + ((index * 131) % (width - oceanWidth - 260)),
    y: 100 + ((index * 97) % (height - 220)),
    size: 16 + (index % 4) * 5
  })).filter((tree) => {
    const inRoad = tree.y > coastalRoadY - 70 && tree.y < coastalRoadY + 110;
    const inCity = tree.x > city.x - 40 && tree.x < city.x + city.w + 40 && tree.y > city.y - 40 && tree.y < city.y + city.h + 40;
    return !inRoad && !inCity;
  });
  const rocks = Array.from({ length: 160 }, (_, index) => ({
    x: oceanWidth + 80 + ((index * 177) % (width - oceanWidth - 160)),
    y: 120 + ((index * 143) % (height - 220)),
    size: 12 + (index % 3) * 6
  }));
  const mountains = [
    { x: width * 0.58, y: height * 0.08, w: 280, h: 180 },
    { x: width * 0.66, y: height * 0.06, w: 340, h: 220 },
    { x: width * 0.76, y: height * 0.05, w: 300, h: 210 },
    { x: width * 0.45, y: height * 0.02, w: 260, h: 160 }
  ];
  const farms = [
    { x: width * 0.27, y: height * 0.84, w: 360, h: 180, type: "wheat" },
    { x: width * 0.39, y: height * 0.8, w: 320, h: 160, type: "vegetable" },
    { x: width * 0.68, y: height * 0.74, w: 280, h: 150, type: "flower" }
  ];
  const barns = [
    { x: width * 0.25, y: height * 0.78, w: 120, h: 90 },
    { x: width * 0.44, y: height * 0.75, w: 130, h: 96 },
    { x: width * 0.67, y: height * 0.69, w: 122, h: 92 }
  ];
  const trafficLights = [
    { x: city.x + city.w * 0.43, y: city.y + city.h * 0.45, state: "green", timer: 0 },
    { x: city.x + city.w * 0.43, y: city.y + city.h * 0.68, state: "red", timer: 2.5 },
    { x: city.x + city.w * 0.7, y: city.y + city.h * 0.45, state: "yellow", timer: 1.4 }
  ];

  return {
    width,
    height,
    oceanWidth,
    coastalRoadY,
    village,
    villages,
    city,
    kingdom,
    suburb,
    bunker,
    busStop,
    dungeon: { x: width * 0.82, y: height * 0.72, r: 180 },
    cityBlocks: Array.from({ length: 42 }, (_, index) => {
      const col = index % 7;
      const row = Math.floor(index / 7);
      return {
        x: city.x + 34 + col * (city.w / 8.1),
        y: city.y + 30 + row * (city.h / 6.4),
        w: 78 + (index % 3) * 18,
        h: 92 + (index % 4) * 18,
        color: ["#c2d2e9", "#aebfd9", "#d4b48b", "#9fb0cc"][index % 4]
      };
    }),
    trees,
    rocks,
    mountains,
    farms,
    barns,
    caves,
    eventSpots,
    interiors,
    trafficLights,
    roads: [
      { x: oceanWidth - 80, y: coastalRoadY, w: width * 0.75, h: 74 },
      { x: village.x + village.w * 0.46, y: village.y + village.h * 0.3, w: 74, h: height * 0.34 },
      { x: city.x + city.w * 0.42, y: city.y, w: 84, h: city.h + 280 },
      { x: city.x, y: city.y + city.h * 0.46, w: city.w + 340, h: 90 },
      { x: kingdom.x - 120, y: kingdom.y + kingdom.h * 0.5, w: 220, h: 76 },
      { x: villages[1].x + 50, y: villages[1].y - 150, w: 70, h: 200 },
      { x: villages[2].x + villages[2].w - 30, y: villages[2].y + 40, w: 180, h: 68 },
      { x: villages[3].x + 40, y: villages[3].y - 130, w: 72, h: 190 },
      { x: villages[4].x - 120, y: villages[4].y + 46, w: 170, h: 70 }
    ],
    houses,
    obstacles: [
      { x: width * 0.31, y: height * 0.64, w: 200, h: 120, type: "forest" },
      { x: width * 0.67, y: height * 0.48, w: 180, h: 160, type: "ruin" },
      harbor
    ]
  };
}

function createHero() {
  const base = state.launcher.difficulty === "legend" ? 90 : state.launcher.difficulty === "relaxed" ? 130 : 110;
  return {
    name: state.launcher.heroName,
    x: 900,
    y: 900,
    radius: 22,
    speed: 180,
    vehicleSpeed: 280,
    mounted: null,
    attackCooldown: 0,
    skillCooldown: 0,
    interactCooldown: 0,
    health: base,
    maxHealth: base,
    energy: 100,
    maxEnergy: 100,
    facing: 0,
    hurt: 0
  };
}

function createCompanion(name, tint, x, y, imageKey) {
  return {
    name,
    tint,
    imageKey,
    x,
    y,
    radius: 18,
    recruited: false,
    followOffset: rand(-40, 40),
    attackCooldown: 0,
    seatOffsetX: 0,
    seatOffsetY: 0
  };
}

function createNpc(name, role, x, y, color, dialog, imageKey) {
  return { name, role, x, y, radius: 20, color, dialog, imageKey, hp: 90, maxHp: 90 };
}

function pickDialog(dialog) {
  return Array.isArray(dialog) ? dialog[Math.floor(Math.random() * dialog.length)] : dialog;
}

function createCitizen(name, x, y, imageKey, district) {
  return {
    name,
    role: "citizen",
    x,
    y,
    homeX: x,
    homeY: y,
    district,
    radius: 18,
    color: "#ffe6b3",
    dialog: district === "city"
      ? [
        "Kota ini ramai dari pagi sampai malam. Dealer, pasar, dan jalan besar ada di pusat kota.",
        "Kalau kamu tersesat di kota ini, anggap saja itu tur gratis.",
        "Festival jalanan kadang lebih seru daripada misi resmi."
      ]
      : [
        "Desa kami tenang, tapi dunia di luar sedang berubah cepat. Ikuti jalan utama kalau ingin aman.",
        "Kalau lihat awan aneh, pulang dulu. Cuaca sekarang suka drama.",
        "Mammoth pernah terlihat dekat goa. Lucu, tapi tetap bahaya."
      ],
    imageKey,
    wanderTimer: rand(0.4, 2.4),
    targetX: x,
    targetY: y,
    hp: 48,
    maxHp: 48
  };
}

function createAnimal(type, x, y) {
  return {
    type,
    x,
    y,
    homeX: x,
    homeY: y,
    targetX: x,
    targetY: y,
    radius: type === "bird" ? 9 : type === "sheep" ? 14 : type === "mammoth" ? 26 : type === "whale" ? 34 : 12,
    speed: type === "bird" ? 42 : type === "mammoth" ? 18 : type === "whale" ? 16 : 28,
    timer: rand(0.4, 2.2)
  };
}

function createGuard(name, x, y, imageKey) {
  return createNpc(name, "guard", x, y, "#9ed9ff", [
    "Warga sipil dilarang menebas di area kerajaan. Ikuti jalan utama dan hormati aturan.",
    "Kalau malam datang, jangan berkeliaran sendirian di luar tembok kerajaan.",
    "Kerajaan sedang sibuk. Tetap waspada dan simpan energimu untuk misi besar."
  ], imageKey);
}

function createVehicle(type, x, y) {
  return {
    type,
    x,
    y,
    radius: type === "car" ? 28 : type === "jeep" ? 30 : type === "hover" ? 24 : type === "boat" ? 26 : 20,
    speedBoost: type === "car" ? 1.65 : type === "jeep" ? 1.9 : type === "hover" ? 2.15 : type === "boat" ? 1.7 : 1.35,
    occupied: false,
    owned: true,
    autopilot: false,
    driverKey: null,
    routeAxis: "x",
    routeMin: x - 100,
    routeMax: x + 100,
    direction: 1
  };
}

function createQuest(id, title, text) {
  return { id, title, text, done: false, active: false };
}

const QUEST_CUTSCENES = {
  vehicle: [{ title: "Motor Aktif", text: "Mesin tua itu akhirnya hidup. Jalan pesisir kini terbuka untuk perjalanan yang lebih jauh." }],
  elder: [{ title: "Pesan Elder", text: "Elder Sol membuka peta masalah yang lebih besar dari desa kecil ini." }],
  companion: [{ title: "Tim Bertambah", text: "Nia resmi ikut perjalanan. Dunia terasa lebih ringan saat tidak menjelajah sendirian." }],
  cave: [{ title: "Bisikan Goa", text: "Suara dari Goa Echo menyiratkan bahwa dunia ini menyimpan lebih banyak rahasia dari yang tampak." }],
  city: [{ title: "Gerbang Metropolis", text: "Kota raksasa akhirnya terbuka. Jalan lebar, lampu lalu lintas, dan keramaian mulai menelan horizon." }],
  festival: [{ title: "Festival Jalanan", text: "Di tengah hiruk pikuk kota, kamu menemukan sisi lucu dan hangat dari CoreChiper." }],
  kingdom: [{ title: "Tembok Kerajaan", text: "Setelah melewati jalan utama, kerajaan besar kini benar-benar ada di hadapanmu." }],
  blade: [{ title: "Pedang Kerajaan", text: "Bilah baru di tanganmu terasa seperti awal fase petualangan yang lebih berbahaya." }],
  beast: [{ title: "Raksasa Dunia", text: "Mammoth dan whale membuktikan bahwa dunia ini lebih liar dan lebih besar dari dugaan siapa pun." }],
  dungeon: [{ title: "Gerbang Badai", text: "Shard dari dungeon membuat seluruh perjalananmu terasa nyata: ancaman besar itu benar-benar ada." }]
};

function createIntroStory() {
  return [
    {
      title: "Cutscene 1: Langit Core",
      text: `Di pesisir CoreChiper, laut terus bergerak dan langit mulai retak oleh petir.
Kabar tentang dungeon, bandit malam, dan kerajaan besar menyebar ke setiap desa dan kota.`
    },
    {
      title: "Cutscene 2: Panggilan Jalan",
      text: `${state.launcher.heroName} datang tanpa nama besar, hanya dengan tekad untuk menjelajah dunia terbuka yang sangat luas ini.
Motor tua di tepi jalan pesisir menjadi awal perjalanan menuju desa ramai, metropolis besar, dan takdir yang lebih besar.`
    },
    {
      title: "Cutscene 3: Desa Pertama",
      text: `Warga menunggu pertolongan, companion menunggu dipertemukan, dan misi utama sudah dimulai.
Ambil kendaraan awalmu, ikuti jalan utama, lalu tulis ceritamu sendiri di dunia yang hidup, ramai, dan terus bergerak ini.`
    },
    {
      title: "Cutscene 4: Kota Raksasa",
      text: `Di pusat map berdiri kota super besar dengan lampu lalu lintas, festival jalanan, dan kendaraan yang tidak pernah benar-benar tidur.
Keramaian itu menyembunyikan petunjuk penting untuk misi yang lebih besar.`
    },
    {
      title: "Cutscene 5: Kawan Perjalanan",
      text: `Nia dan Rook bukan sekadar follower. Mereka akan ikut bertarung, ikut menjelajah, dan kini bisa ikut menumpang kendaraan bersamamu.
Perjalanan terasa lebih hidup ketika tim benar-benar bergerak bersama.`
    },
    {
      title: "Cutscene 6: Cuaca Gila",
      text: `Di dunia ini cuaca bisa berubah cepat: siang dan malam berganti, mendung turun, hujan datang, topan berputar, dan banjir sesekali menelan jalan rendah.
Setiap perjalanan punya rasa yang berbeda.`
    },
    {
      title: "Cutscene 7: Goa dan Raksasa",
      text: `Goa misterius, mammoth liar, dan ombak besar menyimpan kejutan yang tidak selalu ramah.
Kalau berani menyimpang dari jalan utama, hadiahnya juga lebih besar.`
    },
    {
      title: "Cutscene 8: Ultra Journey",
      text: `Ini bukan lagi sekadar map besar, tapi dunia yang sibuk, lucu, dan kadang kacau.
Masuk, jelajahi, rekrut teman, kejar event, dan buat cerita paling liar milikmu sendiri.`
    }
  ];
}

function startIntroStory() {
  state.story.lines = createIntroStory();
  state.story.index = 0;
  state.story.timer = 0;
  state.story.active = true;
}

function startStorySequence(lines) {
  state.story.lines = lines;
  state.story.index = 0;
  state.story.timer = 0;
  state.story.active = true;
}

function advanceStory() {
  if (!state.story.active) return;
  state.story.index += 1;
  state.story.timer = 0;
  playSfx("interact");
  if (state.story.index >= state.story.lines.length) {
    state.story.active = false;
    addLog("Prolog selesai. Dunia terbuka menunggumu.");
  }
}

function updateStory(dt) {
  if (!state.story.active) return;
  state.story.timer += dt;
  if (state.story.timer >= state.story.autoAdvance) {
    advanceStory();
  }
}

function addLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 10);
  ui.eventLog.innerHTML = state.log.map((line) => `<p>${line}</p>`).join("");
}

function renderInventory() {
  const entries = Object.entries(state.inventory).filter(([, value]) => value > 0);
  ui.inventoryList.innerHTML = entries.map(([key, value]) => `
    <article class="inventory-item">
      <strong>${ITEM_LABELS[key] || key}</strong>
      <span>${value} pcs</span>
    </article>
  `).join("") || `<article class="inventory-item"><strong>Empty</strong><span>Cari item di dunia.</span></article>`;
  ui.selectedItem.textContent = ITEM_LABELS[state.hotbar[state.selectedSlot]] || "None";
}

function renderHotbar() {
  ui.hotbar.innerHTML = state.hotbar.map((item, index) => `
    <button class="hotbar-slot ${index === state.selectedSlot ? "active" : ""}" data-slot="${index}">
      <strong>${ITEM_LABELS[item]}</strong>
      <span>${state.inventory[item] || 0}</span>
    </button>
  `).join("");
  ui.hotbar.querySelectorAll("[data-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSlot = Number(button.dataset.slot);
      renderHotbar();
      renderInventory();
    });
  });
}

function renderParty() {
  const active = state.companions.filter((companion) => companion.recruited);
  ui.partyLabel.textContent = active.length ? `${active.length + 1} Heroes` : "Solo Run";
  ui.partyList.innerHTML = active.length
    ? active.map((companion) => `<article class="inventory-item"><strong>${companion.name}</strong><span>Companion online</span></article>`).join("")
    : `<article class="inventory-item"><strong>${state.launcher.heroName}</strong><span>Ambil motor lalu cari companion di desa.</span></article>`;
}

function renderQuests() {
  ui.questList.innerHTML = state.quests.map((quest) => `
    <article class="recipe-card">
      <strong>${quest.done ? "Completed" : quest.active ? "Active" : "Pending"} - ${quest.title}</strong>
      <span>${quest.text}</span>
    </article>
  `).join("");
}

function renderHud() {
  const hero = state.player || createHero();
  ui.healthLabel.textContent = `${Math.ceil(hero.health)} / ${hero.maxHealth}`;
  ui.energyLabel.textContent = `${Math.ceil(hero.energy)} / ${hero.maxEnergy}`;
  ui.dayLabel.textContent = isNight() ? "Night" : "Day";
  ui.modeLabel.textContent = hero.mounted ? `Ride ${hero.mounted.type}` : "Explore";
  ui.healthFill.style.width = `${(hero.health / hero.maxHealth) * 100}%`;
  ui.energyFill.style.width = `${(hero.energy / hero.maxEnergy) * 100}%`;
  const activeQuest = state.quests.find((quest) => quest.active && !quest.done) || state.quests[state.quests.length - 1];
  ui.objectiveText.textContent = activeQuest?.title || "World Complete";
  ui.weatherLabel.textContent = state.weather.type === "storm"
    ? "Storm + Lightning"
    : state.weather.type === "rain"
      ? "Rain"
      : state.weather.type === "overcast"
        ? "Overcast"
        : state.weather.type === "tornado"
          ? "Tornado"
          : state.weather.type === "flood"
            ? "Flood"
            : "Clear Sky";
  ui.continueBtn.disabled = !state.launcher.hasSave;
}

function completeQuest(id) {
  const quest = state.quests.find((entry) => entry.id === id);
  if (!quest || quest.done) return;
  quest.done = true;
  quest.active = false;
  const next = state.quests.find((entry) => !entry.done && !entry.active);
  if (next) next.active = true;
  playSfx("quest");
  addLog(`Quest selesai: ${quest.title}`);
  if (QUEST_CUTSCENES[id]) {
    startStorySequence(QUEST_CUTSCENES[id]);
  }
  renderQuests();
}

function canAfford(cost) {
  return (state.inventory.gold || 0) >= cost;
}

function spendGold(cost) {
  state.inventory.gold = Math.max(0, (state.inventory.gold || 0) - cost);
}

function startWorld(options = {}) {
  const {
    skipIntro = false,
    spawn = "coast",
    savedGame = null
  } = options;
  state.launcher.heroName = ui.worldNameInput.value.trim() || state.launcher.heroName || "Aru";
  state.launcher.worldSize = ui.worldSizeSelect.value || state.launcher.worldSize;
  state.launcher.difficulty = ui.difficultySelect.value || state.launcher.difficulty;
  state.launcher.theme = ui.worldThemeSelect.value || state.launcher.theme;

  state.world = createWorldModel();
  state.player = createHero();
  if (spawn === "bus-terminal") {
    state.player.x = state.world.busStop.x + state.world.busStop.w / 2 - 18;
    state.player.y = state.world.busStop.y + state.world.busStop.h + 52;
  } else if (spawn === "bunker-terminal") {
    state.player.x = state.world.bunker.x + state.world.bunker.w / 2;
    state.player.y = state.world.bunker.y + state.world.bunker.h + 52;
  } else {
    state.player.x = state.world.oceanWidth + 120;
    state.player.y = state.world.coastalRoadY + 36;
  }
  state.companions = [
    createCompanion("Nia", "#ffdf7b", state.world.village.x + 160, state.world.village.y + 80, "npc4"),
    createCompanion("Rook", "#91c8ff", state.world.village.x + 210, state.world.village.y + 120, "npc5")
  ];
  state.npcs = [
    createNpc("Elder Sol", "elder", state.world.village.x + 90, state.world.village.y + 120, "#ffd66b", [
      "Datanglah setelah kamu mengambil motor awal dan siap menerima misi utama.",
      "Desa ini kecil, tapi masalah yang datang sudah sebesar kota.",
      "Jangan cuma cepat, jadilah cerdas saat menjelajah."
    ], "npc1"),
    createNpc("Mira", "ally", state.world.village.x + 180, state.world.village.y + 70, "#ff9dd0", [
      "Aku bisa ikut jika kamu siap melindungi desa.",
      "Kalau kamu nekat, aku ikut. Tapi jangan gaya-gayaan sendirian.",
      "Teman jalan yang baik itu bukan yang diam, tapi yang sigap."
    ], "npc2"),
    createNpc("Bex", "mechanic", state.world.village.x + 220, state.world.village.y + 150, "#98ffba", [
      "Motor awalmu sudah siap di tepi jalan. Pakai itu dulu untuk memulai petualangan.",
      "Kalau kendaraanmu bunyi aneh, anggap saja itu fitur.",
      "Mesin bagus, jalan bagus, mood juga harus bagus."
    ], "npc3"),
    createNpc("Vara", "dealer", state.world.city.x + 120, state.world.city.y + 110, "#f6b26b", [
      "Aku menjual mobil, jeep, dan hover cart untuk penjelajah ambisius.",
      "Kalau mau keren, kendaraanmu juga harus punya gaya.",
      "Kota besar butuh kendaraan yang tidak bikin malu."
    ], "npc6"),
    createNpc("Sir Caldor", "smith", state.world.kingdom.x + 150, state.world.kingdom.y + 180, "#d5d2ff", [
      "Kerajaan menyediakan pedang dan senjata untuk pahlawan yang cukup kaya.",
      "Besi bagus lahir dari panas, pahlawan bagus lahir dari masalah.",
      "Kalau mau damage besar, jangan ragu investasi."
    ], "npc7"),
    createNpc("Lady Orlin", "realtor", state.world.suburb.x + 140, state.world.suburb.y + 110, "#ffd0e8", [
      "Rumah di distrik suburb bisa kamu beli jika punya cukup gold.",
      "Base yang nyaman bikin petualangan lebih santai.",
      "Rumah bagus, hidup rapi, loot aman."
    ], "npc8"),
    createNpc("Marshal Iven", "guard", state.world.kingdom.x + 250, state.world.kingdom.y + 230, "#9ed9ff", [
      "Jalan menuju kerajaan aman jika kamu siap menghadapi para bandit malam.",
      "Malam di luar tembok itu lucu sampai raider datang.",
      "Jalan utama aman, tapi aman bukan berarti mudah."
    ], "npc9"),
    createNpc("Toma", "fisher", state.world.oceanWidth + 70, state.world.height * 0.7, "#fff0a6", [
      "Pelaut hebat selalu pulang dengan ikan dan shell berharga.",
      "Kalau laut tenang, jangan percaya penuh. Laut suka bercanda.",
      "Ikan besar kadang datang saat cuaca paling aneh."
    ], "npc10"),
    createGuard("Penjaga Aras", state.world.kingdom.x + 90, state.world.kingdom.y + 150, "npc4"),
    createGuard("Penjaga Brena", state.world.kingdom.x + 310, state.world.kingdom.y + 150, "npc5")
  ];
  state.citizens = [];
  state.trafficLights = state.world.trafficLights.map((light) => ({ ...light }));
  const citizenSkins = ["npc1", "npc2", "npc3", "npc4", "npc5", "npc6", "npc7", "npc8", "npc9", "npc10"];
  state.world.villages.forEach((area, areaIndex) => {
    for (let i = 0; i < 8; i += 1) {
      state.citizens.push(createCitizen(
        `Warga Desa ${areaIndex + 1}-${i + 1}`,
        area.x + 40 + (i % 4) * 56,
        area.y + 52 + Math.floor(i / 4) * 72,
        citizenSkins[(i + areaIndex) % citizenSkins.length],
        "village"
      ));
    }
  });
  for (let i = 0; i < 72; i += 1) {
    state.citizens.push(createCitizen(
      `Penduduk Kota ${i + 1}`,
      state.world.city.x + 42 + (i % 8) * 92,
      state.world.city.y + 50 + Math.floor(i / 8) * 72,
      citizenSkins[(i + 3) % citizenSkins.length],
      "city"
    ));
  }
  for (let i = 0; i < 12; i += 1) {
    state.citizens.push(createCitizen(
      `Warga Suburb ${i + 1}`,
      state.world.suburb.x + 36 + (i % 4) * 70,
      state.world.suburb.y + 46 + Math.floor(i / 4) * 74,
      citizenSkins[(i + 5) % citizenSkins.length],
      "suburb"
    ));
  }
  for (let i = 0; i < 10; i += 1) {
    state.citizens.push(createCitizen(
      `Penjaga Kota ${i + 1}`,
      state.world.kingdom.x + 46 + (i % 5) * 58,
      state.world.kingdom.y + state.world.kingdom.h + 40 + Math.floor(i / 5) * 60,
      citizenSkins[(i + 7) % citizenSkins.length],
      "kingdom"
    ));
  }
  state.vehicles = [
    createVehicle("bike", state.world.oceanWidth + 178, state.world.coastalRoadY + 38),
    createVehicle("car", state.world.city.x + state.world.city.w * 0.18, state.world.city.y + state.world.city.h + 94),
    createVehicle("jeep", state.world.city.x + state.world.city.w * 0.34, state.world.city.y + state.world.city.h + 96),
    createVehicle("hover", state.world.kingdom.x + 80, state.world.kingdom.y + state.world.kingdom.h + 74),
    createVehicle("boat", state.world.oceanWidth - 68, state.world.height * 0.73)
  ];
  state.vehicles.push(
    { ...createVehicle("car", state.world.city.x + 120, state.world.city.y + state.world.city.h * 0.46 + 28), autopilot: true, occupied: true, driverKey: "npc6", routeAxis: "x", routeMin: state.world.city.x + 40, routeMax: state.world.city.x + state.world.city.w + 190, speedBoost: 1.25 },
    { ...createVehicle("jeep", state.world.city.x + state.world.city.w * 0.44, state.world.city.y + 80), autopilot: true, occupied: true, driverKey: "npc7", routeAxis: "y", routeMin: state.world.city.y + 20, routeMax: state.world.city.y + state.world.city.h + 180, speedBoost: 1.2 },
    { ...createVehicle("bike", state.world.villages[1].x + 110, state.world.villages[1].y - 32), autopilot: true, occupied: true, driverKey: "npc3", routeAxis: "x", routeMin: state.world.villages[1].x - 10, routeMax: state.world.villages[1].x + state.world.villages[1].w + 120, speedBoost: 1.08 },
    { ...createVehicle("boat", state.world.oceanWidth - 120, state.world.height * 0.38), autopilot: true, occupied: true, driverKey: "npc10", routeAxis: "y", routeMin: 180, routeMax: state.world.height - 180, speedBoost: 1.1 }
  );
  state.animals = [
    ...Array.from({ length: 16 }, (_, index) => createAnimal("sheep", state.world.villages[index % state.world.villages.length].x + 40 + (index % 4) * 52, state.world.villages[index % state.world.villages.length].y + 180 + Math.floor(index / 4) * 26)),
    ...Array.from({ length: 14 }, (_, index) => createAnimal("deer", state.world.oceanWidth + 320 + (index * 120) % 1800, 220 + (index * 90) % 1300)),
    ...Array.from({ length: 12 }, (_, index) => createAnimal("bird", state.world.city.x + 40 + (index * 70) % Math.max(240, state.world.city.w - 100), state.world.city.y - 40 - (index % 4) * 18)),
    createAnimal("mammoth", state.world.caves[0].x + 120, state.world.caves[0].y + 160),
    createAnimal("mammoth", state.world.caves[1].x - 140, state.world.caves[1].y + 80),
    createAnimal("whale", state.world.oceanWidth * 0.45, state.world.height * 0.34)
  ];
  state.mobs = [];
  state.fish = Array.from({ length: 18 }, (_, index) => ({
    x: rand(80, state.world.oceanWidth - 60),
    y: rand(120, state.world.height - 120),
    speed: rand(22, 48),
    wave: rand(0, Math.PI * 2),
    dir: index % 2 === 0 ? 1 : -1
  }));
  state.effects = [];
  state.log = [];
  state.combo = { hits: 0, timer: 0 };
  state.worldEvent = null;
  state.discoveredAreas = {};
  state.areaBanner = { title: "", subtitle: "", timer: 0 };
  state.saveTimer = 0;
  state.quests = [
    createQuest("vehicle", "Claim the Starter Bike", "Naiki motor awal di dekat spawn untuk memulai perjalanan."),
    createQuest("elder", "Meet the Village Elder", "Temui Elder Sol di pusat desa setelah mendapatkan motor."),
    createQuest("companion", "Recruit a Companion", "Ajak Mira bergabung untuk perjalanan."),
    createQuest("cave", "Visit Echo Cave", "Temukan Goa Echo dan dengarkan rahasia di dalamnya."),
    createQuest("city", "Reach the Grand City", "Jelajahi kota besar dan temui dealer kendaraan."),
    createQuest("festival", "Find the Street Festival", "Cari festival jalanan dan rasakan keramaian kota."),
    createQuest("kingdom", "Reach the Great Kingdom", "Masuk ke wilayah kerajaan besar lewat jalan utama."),
    createQuest("blade", "Buy a Royal Blade", "Beli pedang dari blacksmith kerajaan."),
    createQuest("beast", "Witness a Mega Beast", "Temui mammoth atau whale liar di dunia terbuka."),
    createQuest("dungeon", "Clear the Storm Dungeon", "Masuk dungeon, kalahkan crystal beast, dan bawa kembali shard.")
  ];
  state.quests[0].active = true;
  state.inventory = { herb: 3, ore: 0, shell: 0, fish: 0, gem: 0, parts: 1, potion: 2, gold: 220, blade: 0, deed: 0 };
  state.selectedSlot = 0;
  state.inventoryOpen = true;
  state.worldClock = 0;
  state.weather = { type: "clear", rain: 0, lightningTimer: 14, nextStorm: 50 };
  state.interior = null;
  state.story = {
    active: false,
    index: 0,
    timer: 0,
    autoAdvance: 4.8,
    lines: []
  };
  state.running = true;
  state.launcher.hasSave = true;
  state.screenShake = 0;

  applySavedGame(savedGame, spawn);

  addLog(
    spawn === "bus-terminal"
      ? `${state.launcher.heroName} tiba langsung di terminal bus kota utama.`
      : spawn === "bunker-terminal"
        ? `${state.launcher.heroName} keluar dari bunker dan kembali ke jalur kota.`
        : `${state.launcher.heroName} memulai perjalanan dari pesisir.`
  );
  addLog("Jalan utama menghubungkan desa, kota besar, kerajaan, pelabuhan, peternakan, dan pertanian.");
  addLog("Quest aktif: ambil motor awal di dekat spawn.");
  renderHud();
  renderInventory();
  renderHotbar();
  renderParty();
  renderQuests();
  updateCamera();
  saveGameState();
  if (!skipIntro) startIntroStory();
  showScreen("game");
}

function getNearbyHouse() {
  if (!state.player || !state.world) return null;
  const buildings = [...state.world.houses, ...(state.world.interiors || [])];
  return buildings.find((house) => {
    const cx = house.x + house.w / 2;
    const cy = house.y + house.h / 2;
    return Math.abs(state.player.x - cx) < house.w / 2 + 42 && Math.abs(state.player.y - cy) < house.h / 2 + 42;
  });
}

function getNearbyBunker() {
  if (!state.player || !state.world) return null;
  const bunker = state.world.bunker;
  return Math.abs(state.player.x - (bunker.x + bunker.w / 2)) < bunker.w / 2 + 44
    && Math.abs(state.player.y - (bunker.y + bunker.h / 2)) < bunker.h / 2 + 44
    ? bunker
    : null;
}

function getNearbyBusStop() {
  if (!state.player || !state.world) return null;
  const bus = state.world.busStop;
  return Math.abs(state.player.x - (bus.x + bus.w / 2)) < bus.w / 2 + 54
    && Math.abs(state.player.y - (bus.y + bus.h / 2)) < bus.h / 2 + 44
    ? bus
    : null;
}

function enterHouse(house) {
  state.interior = house;
  state.player.x = house.x + house.w / 2;
  state.player.y = house.y + house.h / 2 + 18;
  const label = house.interiorLabel || (house.district === "suburb" ? "rumah suburb" : "rumah warga");
  addLog(`Masuk ke ${label}. Tekan F untuk keluar.`);
}

function exitHouse() {
  if (!state.interior) return;
  const house = state.interior;
  state.player.x = house.x + house.w / 2;
  state.player.y = house.y + house.h + 44;
  state.interior = null;
  addLog("Keluar dari rumah.");
}

function createMob(origin, x, y) {
  const type = origin === "dungeon" ? "shade" : Math.random() > 0.7 ? "raider" : "wolf";
  return {
    origin,
    type,
    x,
    y,
    radius: type === "raider" ? 22 : 18,
    hp: type === "raider" ? 54 : type === "shade" ? 42 : 28,
    maxHp: type === "raider" ? 54 : type === "shade" ? 42 : 28,
    speed: type === "raider" ? 86 : type === "shade" ? 94 : 110,
    damage: type === "raider" ? 14 : 9,
    attackCooldown: 0
  };
}

function spawnDungeonWave() {
  if (state.mobs.some((mob) => mob.origin === "dungeon")) return;
  for (let i = 0; i < 5; i += 1) {
    state.mobs.push(createMob("dungeon", state.world.dungeon.x + rand(-70, 70), state.world.dungeon.y + rand(-70, 70)));
  }
}

function spawnEventWave(event) {
  const amount = event.type === "raid" ? 5 : event.type === "cave" ? 4 : 3;
  for (let i = 0; i < amount; i += 1) {
    state.mobs.push(createMob(event.type === "cave" ? "dungeon" : "wild", event.x + rand(-90, 90), event.y + rand(-70, 70)));
  }
}

function maybeStartWorldEvent() {
  if (state.worldEvent || Math.random() < 0.9975) return;
  const pool = [
    { type: "raid", title: "Bandit Raid", reward: 120 },
    { type: "festival", title: "Street Festival", reward: 90 },
    { type: "cave", title: "Cave Rumble", reward: 150 },
    { type: "beast", title: "Mega Beast Sighting", reward: 130 }
  ];
  const selected = pool[Math.floor(Math.random() * pool.length)];
  const anchor = selected.type === "cave"
    ? state.world.caves[Math.floor(Math.random() * state.world.caves.length)]
    : selected.type === "festival"
      ? state.world.eventSpots[Math.floor(Math.random() * state.world.eventSpots.length)]
      : { x: rand(state.world.width * 0.28, state.world.width * 0.92), y: rand(180, state.world.height - 180) };

  state.worldEvent = {
    ...selected,
    x: anchor.x + (anchor.w ? anchor.w / 2 : 0),
    y: anchor.y + (anchor.h ? anchor.h / 2 : 0),
    timer: 28,
    rewardGiven: false
  };
  if (selected.type === "raid" || selected.type === "cave") spawnEventWave(state.worldEvent);
  if (selected.type === "beast") {
    state.animals.push(createAnimal("mammoth", state.worldEvent.x + 20, state.worldEvent.y + 16));
  }
  addLog(`Event dunia: ${state.worldEvent.title} muncul. Cari lokasinya!`);
}

function toggleMount(vehicle) {
  const hero = state.player;
  if (!hero) return;
  if (vehicle.autopilot) {
    addLog(`${vehicle.type} sedang dipakai warga kota.`);
    playSfx("interact");
    return;
  }
  if (hero.mounted && hero.mounted === vehicle) {
    hero.mounted.occupied = false;
    hero.mounted = null;
    stopVehicleLoop();
    addLog(`${vehicle.type} ditinggalkan.`);
  } else {
    stopVehicleLoop();
    state.vehicles.forEach((entry) => { entry.occupied = false; });
    vehicle.occupied = true;
    hero.mounted = vehicle;
    if (vehicle.type === "bike") {
      completeQuest("vehicle");
      addLog("Motor awal aktif. Sekarang kamu bisa menuju desa.");
    } else if (vehicle.type === "car") {
      addLog("Mobil memberi handling halus dan laju stabil di jalan lebar.");
    } else if (vehicle.type === "jeep") {
      addLog("Jeep terasa kuat untuk jalan kasar dan area luar kota.");
    } else if (vehicle.type === "hover") {
      addLog("Hover meluncur ringan dengan aura neon di sekitar kendaraan.");
      state.effects.push({ type: "ring", x: hero.x, y: hero.y + 18, life: 0.25, radius: 22 });
    } else if (vehicle.type === "boat") {
      addLog("Boat melaju santai di laut dengan ombak yang lebih halus.");
    }
    addLog(`${vehicle.type} dinaiki.`);
    if (!startVehicleLoop(vehicle.type)) {
      playSfx(`vehicle-${vehicle.type}`);
    }
  }
}

function handleInteraction() {
  if (!state.running || !state.player || state.player.interactCooldown > 0) return;
  state.player.interactCooldown = 0.5;

  if (state.interior) {
    exitHouse();
    return;
  }

  const house = getNearbyHouse();
  if (house) {
    enterHouse(house);
    playSfx("interact");
    return;
  }

  const bunker = getNearbyBunker();
  if (bunker) {
    saveGameState();
    setReturnState({ spawn: "bunker-terminal" });
    window.location.href = "bunker.html";
    return;
  }

  const busStop = getNearbyBusStop();
  if (busStop) {
    saveGameState();
    setReturnState({ spawn: "bus-terminal" });
    window.location.href = "city2.html";
    return;
  }

  const nearVehicle = state.vehicles.find((vehicle) => dist(vehicle, state.player) < 80);
  if (nearVehicle) {
    toggleMount(nearVehicle);
    return;
  }
}

function handleTalk() {
  if (!state.running || !state.player || state.player.interactCooldown > 0 || state.interior) return;
  state.player.interactCooldown = 0.5;
  const nearNpc = [...state.npcs, ...state.citizens].find((npc) => dist(npc, state.player) < 90);
  if (nearNpc) {
    playSfx("interact");
    addLog(`${nearNpc.name}: ${pickDialog(nearNpc.dialog)}`);
    if (nearNpc.role === "citizen") {
      return;
    }
    if (nearNpc.role === "elder") {
      if (state.quests.find((quest) => quest.id === "vehicle")?.done) {
        completeQuest("elder");
      } else {
        addLog("Elder Sol: ambil dulu motormu, baru kita bicara soal misi besar.");
      }
    }
    if (nearNpc.role === "ally") {
      const companion = state.companions.find((entry) => entry.name === "Nia");
      if (companion && !companion.recruited) {
        companion.recruited = true;
        addLog("Nia bergabung sebagai companion.");
        completeQuest("companion");
        renderParty();
      }
    }
    if (nearNpc.role === "dealer") {
      openShop(nearNpc);
    }
    if (nearNpc.role === "smith") {
      openShop(nearNpc);
    }
    if (nearNpc.role === "realtor") {
      openShop(nearNpc);
    }
    if (nearNpc.role === "fisher") {
      state.inventory.fish += 1;
      state.inventory.shell += 1;
      state.inventory.gold += 20;
      addLog("Toma membantumu memancing dan menjual hasil tangkapan. Gold +20.");
      renderInventory();
      renderHotbar();
    }
    return;
  }

  if (state.player.x < state.world.oceanWidth + 90) {
    if (Math.random() > 0.45) {
      state.inventory.fish += 1;
      addLog("Kamu menangkap ikan dari pesisir.");
    } else {
      state.inventory.shell += 1;
      addLog("Kamu menemukan shell langka di bibir pantai.");
    }
    playSfx("interact");
    renderInventory();
    renderHotbar();
    return;
  }

  const cave = state.world.caves.find((entry) => dist(entry, state.player) < entry.r + 40);
  if (cave) {
    addLog(`${cave.label} terasa misterius. Ada suara lucu dan aneh dari dalam.`);
    playSfx("storm");
    return;
  }

  const dungeonCenter = { x: state.world.dungeon.x, y: state.world.dungeon.y };
  if (dist(dungeonCenter, state.player) < state.world.dungeon.r + 40) {
    spawnDungeonWave();
    addLog("Dungeon aktif. Musuh keluar dari gerbang petir.");
    playSfx("storm");
  }
}

function useSkill() {
  const hero = state.player;
  if (!hero || hero.skillCooldown > 0 || hero.energy < 24) return;
  hero.energy -= 24;
  hero.skillCooldown = 4.2;
  state.mobs.forEach((mob) => {
    if (dist(mob, hero) < 150) {
      mob.hp -= 22;
      const push = normalize(mob.x - hero.x, mob.y - hero.y);
      mob.x += push.x * 36;
      mob.y += push.y * 36;
    }
  });
  state.effects.push({ type: "ring", x: hero.x, y: hero.y, life: 0.4, radius: 40 });
  playSfx("skill");
  addLog("Storm pulse dilepas.");
}

function attack() {
  const hero = state.player;
  if (!hero || hero.attackCooldown > 0) return;
  hero.attackCooldown = 0.35;
  const range = 92;
  const comboBonus = Math.min(18, state.combo.hits * 2);
  const damage = ((state.inventory.blade || 0) > 0 ? 30 : 18) + comboBonus;
  let hits = 0;
  state.mobs.forEach((mob) => {
    const dx = mob.x - hero.x;
    const dy = mob.y - hero.y;
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(angle - hero.facing);
    if (dist(mob, hero) < range && (diff < 1 || diff > 5.2)) {
      mob.hp -= damage;
      hits += 1;
    }
  });
  state.effects.push({ type: "slash", x: hero.x, y: hero.y, facing: hero.facing, life: 0.16, radius: 74 });
  playSfx("hit");
  if (hits) {
    state.combo.hits += hits;
    state.combo.timer = 3.4;
    if (state.combo.hits >= 8) {
      state.effects.push({ type: "ring", x: hero.x, y: hero.y, life: 0.25, radius: 24 });
    }
    addLog(`Serangan mengenai ${hits} target. Combo ${state.combo.hits}x.`);
  } else {
    state.combo.hits = 0;
    state.combo.timer = 0;
  }
}

function craftReward() {
  if (state.inventory.herb >= 2) {
    state.inventory.herb -= 2;
    state.inventory.potion += 1;
    addLog("Potion dibuat dari herb.");
    playSfx("craft");
  } else if (state.inventory.parts >= 1 && state.inventory.ore >= 1) {
    state.inventory.parts -= 1;
    state.inventory.ore -= 1;
    state.inventory.gem += 1;
    addLog("Core gem rakitan berhasil dibuat.");
    playSfx("craft");
  } else {
    addLog("Bahan crafting belum cukup.");
  }
  renderInventory();
  renderHotbar();
}

function toggleInventory() {
  state.inventoryOpen = !state.inventoryOpen;
  document.querySelector(".sidebar").classList.toggle("hidden", !state.inventoryOpen);
}

function maybeSpawnWorldMob(dt) {
  if (!isNight()) return;
  if (state.mobs.length > 11) return;
  if (Math.random() > 0.985) {
    state.mobs.push(createMob("wild", rand(state.world.width * 0.32, state.world.width - 120), rand(140, state.world.height - 140)));
    addLog("Mob liar berkeliaran saat malam.");
  }
}

function updateWeather(dt) {
  if (state.weatherLevel === "off") {
    state.weather.type = "clear";
    state.weather.rain = 0;
    return;
  }

  if (state.weather.type === "clear" && state.weather.nextStorm <= 0) {
    const roll = Math.random();
    state.weather.type = roll > 0.84 ? "tornado" : roll > 0.68 ? "flood" : roll > 0.46 ? "storm" : roll > 0.24 ? "rain" : "overcast";
    state.weather.rain = state.weatherLevel === "light" ? 0.5 : 1;
    state.weather.lightningTimer = rand(3, 9);
    state.weather.nextStorm = rand(40, 84);
    addLog(
      state.weather.type === "storm"
        ? "Awan gelap datang. Petir mulai muncul."
        : state.weather.type === "rain"
          ? "Hujan turun di seluruh wilayah."
          : state.weather.type === "overcast"
            ? "Langit mendung menutup cahaya."
            : state.weather.type === "tornado"
              ? "Angin topan muncul. Pegang arah kendaraanmu."
              : "Banjir sesekali mulai menutupi jalan rendah."
    );
    playSfx(state.weather.type === "tornado" ? "storm" : "rain");
  }

  if (state.weather.type !== "clear") {
    state.weather.lightningTimer -= dt;
    if (state.weather.type === "storm" && state.weather.lightningTimer <= 0) {
      state.weather.lightningTimer = rand(4, 10);
      state.effects.push({ type: "lightning", x: rand(80, state.world.width - 80), y: rand(20, 100), life: 0.22 });
      state.screenShake = 12;
      playSfx("lightning");
    }
    if (state.weather.type === "tornado" && Math.random() > 0.93) {
      state.effects.push({ type: "tornado", x: rand(120, state.world.width - 120), y: rand(120, state.world.height - 120), life: 0.5, radius: 26 });
      state.screenShake = 5;
    }
    if (state.weather.type === "flood" && Math.random() > 0.95) {
      state.effects.push({ type: "flood", x: rand(0, state.world.width), y: rand(0, state.world.height), life: 0.4, radius: 90 });
    }
    state.weather.nextStorm -= dt * 0.35;
    if (state.weather.nextStorm <= 18) {
      state.weather.type = "clear";
      state.weather.rain = 0;
      state.weather.nextStorm = rand(55, 110);
      addLog("Cuaca kembali tenang.");
    }
  }
}

function updateWorldEvents(dt) {
  maybeStartWorldEvent();
  if (!state.worldEvent || !state.player) return;
  state.worldEvent.timer -= dt;
  if (dist(state.player, state.worldEvent) < 110 && !state.worldEvent.rewardGiven) {
    state.worldEvent.rewardGiven = true;
    state.inventory.gold += state.worldEvent.reward;
    state.inventory.gem += state.worldEvent.type === "cave" ? 1 : 0;
    addLog(`Event selesai: ${state.worldEvent.title}. Gold +${state.worldEvent.reward}.`);
    playSfx("quest");
    renderInventory();
    renderHotbar();
  }
  if (state.worldEvent.timer <= 0) {
    if (!state.worldEvent.rewardGiven) addLog(`Event berakhir: ${state.worldEvent.title}.`);
    state.worldEvent = null;
  }
}

function updatePlayer(dt) {
  const hero = state.player;
  if (!hero) return;

  const input = getInputVector();
  hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
  hero.skillCooldown = Math.max(0, hero.skillCooldown - dt);
  hero.interactCooldown = Math.max(0, hero.interactCooldown - dt);
  hero.hurt = Math.max(0, hero.hurt - dt);
  hero.energy = clamp(hero.energy + dt * 10, 0, hero.maxEnergy);
  const inWater = hero.x < state.world.oceanWidth - 10;
  const floodFactor = state.weather.type === "flood" && hero.y > state.world.height * 0.46 ? 0.72 : 1;
  const swimFactor = inWater && !hero.mounted ? 0.55 : 1;
  const boosting = hero.mounted && state.keys.has("ShiftLeft") && hero.energy > 8;
  if (boosting) {
    hero.energy = clamp(hero.energy - dt * 26, 0, hero.maxEnergy);
    if (Math.random() > 0.78) {
      state.effects.push({ type: "spark", x: hero.x - rand(-8, 8), y: hero.y + 18, life: 0.16, radius: 10, color: hero.mounted.type === "hover" ? "#8bf5ff" : "#ffe08a" });
    }
  }
  const tornadoPush = state.weather.type === "tornado" ? Math.sin(performance.now() * 0.0016 + hero.y * 0.002) * 18 * dt : 0;
  const speed = (hero.mounted ? hero.vehicleSpeed * hero.mounted.speedBoost : hero.speed) * swimFactor * floodFactor * (boosting ? 1.35 : 1);

  if (input.len > 0) {
    hero.facing = Math.atan2(input.y, input.x);
    hero.x += input.x * speed * dt;
    hero.y += input.y * speed * dt;
  }
  hero.x += tornadoPush;

  hero.x = clamp(hero.x, 40, state.world.width - 40);
  hero.y = clamp(hero.y, 40, state.world.height - 40);

  if (!state.interior) {
    [...state.world.houses, ...(state.world.interiors || [])].forEach((house) => {
      const doorX = house.x + house.w / 2;
      const doorY = house.y + house.h;
      const insideX = hero.x > house.x - hero.radius && hero.x < house.x + house.w + hero.radius;
      const insideY = hero.y > house.y - hero.radius && hero.y < house.y + house.h + hero.radius;
      const nearDoor = Math.abs(hero.x - doorX) < 28 && Math.abs(hero.y - doorY) < 36;
      if (insideX && insideY && !nearDoor) {
        const leftGap = Math.abs(hero.x - (house.x - hero.radius));
        const rightGap = Math.abs(hero.x - (house.x + house.w + hero.radius));
        const topGap = Math.abs(hero.y - (house.y - hero.radius));
        const bottomGap = Math.abs(hero.y - (house.y + house.h + hero.radius));
        const minGap = Math.min(leftGap, rightGap, topGap, bottomGap);
        if (minGap === leftGap) hero.x = house.x - hero.radius;
        else if (minGap === rightGap) hero.x = house.x + house.w + hero.radius;
        else if (minGap === topGap) hero.y = house.y - hero.radius;
        else hero.y = house.y + house.h + hero.radius;
      }
    });
  }

  if (state.interior) {
    const house = state.interior;
    hero.x = clamp(hero.x, house.x + 28, house.x + house.w - 28);
    hero.y = clamp(hero.y, house.y + 28, house.y + house.h - 18);
  }

  if (hero.mounted) {
    const seaLimit = state.world.oceanWidth + 18;
    if (!["boat", "hover"].includes(hero.mounted.type) && hero.x < seaLimit) {
      hero.x = seaLimit;
    }
    hero.mounted.x = hero.x;
    hero.mounted.y = hero.y + 14;
  }

  if (hero.x > state.world.city.x && hero.x < state.world.city.x + state.world.city.w && hero.y > state.world.city.y && hero.y < state.world.city.y + state.world.city.h) {
    completeQuest("city");
  }
  if (state.world.caves.some((cave) => dist(cave, hero) < cave.r + 20)) {
    completeQuest("cave");
  }
  if (state.world.eventSpots.some((spot) => dist({ x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 }, hero) < 120)) {
    completeQuest("festival");
  }
  if (state.animals.some((animal) => (animal.type === "mammoth" || animal.type === "whale") && dist(animal, hero) < 140)) {
    completeQuest("beast");
  }
  if (hero.x > state.world.kingdom.x && hero.x < state.world.kingdom.x + state.world.kingdom.w && hero.y > state.world.kingdom.y && hero.y < state.world.kingdom.y + state.world.kingdom.h) {
    completeQuest("kingdom");
  }

  if (hero.health <= 0) {
    state.running = false;
    addLog("Perjalanan berakhir. Desa menunggu kebangkitanmu.");
  }
}

function updateCompanions(dt) {
  const hero = state.player;
  state.companions.filter((companion) => companion.recruited).forEach((companion, index) => {
    companion.attackCooldown = Math.max(0, companion.attackCooldown - dt);
    if (hero.mounted) {
      companion.seatOffsetX = index === 0 ? -22 : 22;
      companion.seatOffsetY = hero.mounted.type === "boat" ? 2 : -4;
      companion.x += (hero.x + companion.seatOffsetX - companion.x) * 0.18;
      companion.y += (hero.y + companion.seatOffsetY - companion.y) * 0.18;
      return;
    }
    const targetPos = { x: hero.x - 50 - index * 34, y: hero.y + companion.followOffset * 0.2 };
    const dir = normalize(targetPos.x - companion.x, targetPos.y - companion.y);
    companion.x += dir.x * 110 * dt;
    companion.y += dir.y * 110 * dt;

    const enemy = state.mobs.find((mob) => dist(mob, companion) < 140);
    if (enemy && companion.attackCooldown <= 0) {
      companion.attackCooldown = 1;
      enemy.hp -= 10;
      state.effects.push({ type: "spark", x: enemy.x, y: enemy.y, life: 0.2, radius: 18, color: companion.tint });
    }
  });
}

function updateCitizens(dt) {
  const bunker = state.world.bunker;
  state.citizens.forEach((citizen) => {
    const panic = isNight() && state.mobs.length > 0 && citizen.district !== "kingdom";
    const morning = state.worldClock < 80;
    const day = state.worldClock >= 80 && state.worldClock < 160;
    const evening = state.worldClock >= 160 && state.worldClock < 220;
    if (panic) {
      citizen.targetX = bunker.x + bunker.w / 2 + rand(-26, 26);
      citizen.targetY = bunker.y + bunker.h / 2 + rand(-18, 18);
    }
    citizen.wanderTimer -= dt;
    if (citizen.wanderTimer <= 0 && !panic) {
      citizen.wanderTimer = rand(1.2, 4.8);
      if (citizen.district === "city" && day) {
        citizen.targetX = state.world.city.x + 120 + rand(0, state.world.city.w - 180);
        citizen.targetY = state.world.city.y + 90 + rand(0, state.world.city.h - 150);
      } else if (citizen.district === "suburb" && evening) {
        citizen.targetX = state.world.suburb.x + 40 + rand(0, state.world.suburb.w - 80);
        citizen.targetY = state.world.suburb.y + 40 + rand(0, state.world.suburb.h - 80);
      } else if (citizen.district === "village" && morning) {
        citizen.targetX = citizen.homeX + rand(-28, 72);
        citizen.targetY = citizen.homeY + rand(-24, 52);
      } else if (citizen.district === "kingdom" && day) {
        citizen.targetX = state.world.kingdom.x - 20 + rand(0, state.world.kingdom.w + 40);
        citizen.targetY = state.world.kingdom.y + 20 + rand(0, state.world.kingdom.h + 80);
      } else {
        citizen.targetX = citizen.homeX + rand(-44, 44);
        citizen.targetY = citizen.homeY + rand(-36, 36);
      }
    }
    const dir = normalize(citizen.targetX - citizen.x, citizen.targetY - citizen.y);
    if (dir.len > 4) {
      citizen.x += dir.x * 34 * dt;
      citizen.y += dir.y * 34 * dt;
    }
  });

  state.npcs.filter((npc) => npc.role === "guard").forEach((guard) => {
    const enemy = state.mobs.find((mob) => dist(mob, guard) < 170);
    if (!enemy) return;
    const dir = normalize(enemy.x - guard.x, enemy.y - guard.y);
    guard.x += dir.x * 28 * dt;
    guard.y += dir.y * 28 * dt;
    if (dist(enemy, guard) < 54) {
      enemy.hp -= 14 * dt;
      if (Math.random() > 0.7) {
        state.effects.push({ type: "spark", x: enemy.x, y: enemy.y, life: 0.15, radius: 12, color: "#9ed9ff" });
      }
    }
  });
}

function updateTraffic(dt) {
  state.trafficLights.forEach((light) => {
    light.timer += dt;
    if (light.timer >= 4.5) {
      light.timer = 0;
      light.state = light.state === "green" ? "yellow" : light.state === "yellow" ? "red" : "green";
    }
  });
}

function updateVehicles(dt) {
  state.vehicles.forEach((vehicle) => {
    if (!vehicle.autopilot) return;
    const speed = 90 * vehicle.speedBoost;
    if (vehicle.routeAxis === "x") {
      vehicle.x += vehicle.direction * speed * dt;
      const nearLight = state.trafficLights.find((light) => Math.abs(vehicle.x - light.x) < 36 && Math.abs(vehicle.y - light.y) < 70);
      if (nearLight && nearLight.state === "red") {
        vehicle.x -= vehicle.direction * speed * dt * 0.82;
      }
      if (vehicle.x < vehicle.routeMin || vehicle.x > vehicle.routeMax) {
        vehicle.direction *= -1;
      }
    } else {
      vehicle.y += vehicle.direction * speed * dt;
      const nearLight = state.trafficLights.find((light) => Math.abs(vehicle.x - light.x) < 70 && Math.abs(vehicle.y - light.y) < 36);
      if (nearLight && nearLight.state === "red") {
        vehicle.y -= vehicle.direction * speed * dt * 0.82;
      }
      if (vehicle.y < vehicle.routeMin || vehicle.y > vehicle.routeMax) {
        vehicle.direction *= -1;
      }
    }
  });
}

function updateAnimals(dt) {
  state.animals.forEach((animal) => {
    animal.timer -= dt;
    if (animal.timer <= 0) {
      animal.timer = rand(1.1, 3.2);
      animal.targetX = animal.homeX + rand(-70, 70);
      animal.targetY = animal.homeY + rand(-50, 50);
    }
    const dir = normalize(animal.targetX - animal.x, animal.targetY - animal.y);
    if (dir.len > 3) {
      animal.x += dir.x * animal.speed * dt;
      animal.y += dir.y * animal.speed * dt;
    }
    if (animal.type === "bird") {
      animal.y += Math.sin(performance.now() * 0.003 + animal.homeX * 0.01) * 0.35;
    }
  });
}

function updateMobs(dt) {
  const hero = state.player;
  maybeSpawnWorldMob(dt);
  state.mobs.forEach((mob) => {
    mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);
    const hostileNow = mob.origin === "dungeon" || isNight();
    if (!hostileNow) return;
    const citizenTarget = [...state.citizens, ...state.npcs.filter((npc) => npc.role === "guard")]
      .sort((a, b) => dist(a, mob) - dist(b, mob))[0];
    const target = state.companions.filter((companion) => companion.recruited).sort((a, b) => dist(a, mob) - dist(b, mob))[0];
    let victim = target && dist(target, mob) < dist(hero, mob) ? target : hero;
    if (citizenTarget && dist(citizenTarget, mob) < dist(victim, mob)) {
      victim = citizenTarget;
    }
    const dir = normalize(victim.x - mob.x, victim.y - mob.y);
    mob.x += dir.x * mob.speed * dt;
    mob.y += dir.y * mob.speed * dt;

    if (victim === hero && dist(mob, hero) < mob.radius + hero.radius + 8 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 1.1;
      hero.health = clamp(hero.health - mob.damage, 0, hero.maxHealth);
      hero.hurt = 0.25;
      state.screenShake = 8;
      playSfx("hurt");
      addLog(`${mob.type} menyerang ${hero.name}.`);
    }
    if (victim !== hero && dist(mob, victim) < mob.radius + victim.radius + 8 && mob.attackCooldown <= 0) {
      mob.attackCooldown = 1.1;
      victim.hp = Math.max(0, victim.hp - mob.damage);
      if (Math.random() > 0.72) addLog(`${mob.type} menyerang ${victim.name}.`);
    }
  });

  state.citizens = state.citizens.filter((citizen) => citizen.hp > 0);
  state.npcs = state.npcs.filter((npc) => npc.role !== "guard" || npc.hp > 0);

  state.mobs = state.mobs.filter((mob) => {
    if (mob.hp > 0) return true;
    if (mob.origin === "dungeon") {
      state.inventory.gem += 1;
      state.inventory.gold += 90;
    } else {
      state.inventory.ore += 1;
      state.inventory.gold += mob.type === "raider" ? 40 : 22;
      if (Math.random() > 0.5) state.inventory.herb += 1;
    }
    if (mob.origin === "dungeon" && !state.quests.find((quest) => quest.id === "dungeon").done && !state.mobs.some((entry) => entry.origin === "dungeon" && entry !== mob)) {
      completeQuest("dungeon");
      addLog("Dungeon crystal beast runtuh. Shard berhasil diamankan.");
    }
    renderInventory();
    renderHotbar();
    return false;
  });
}

function updateFish(dt) {
  state.fish.forEach((fish) => {
    fish.wave += dt * 2;
    fish.x += fish.speed * fish.dir * dt;
    fish.y += Math.sin(fish.wave) * 12 * dt;
    if (fish.x < 60 || fish.x > state.world.oceanWidth - 40) fish.dir *= -1;
  });
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.life -= dt;
    if (effect.radius) effect.radius += 120 * dt;
  });
  state.effects = state.effects.filter((effect) => effect.life > 0);
  state.screenShake = Math.max(0, state.screenShake - dt * 30);
}

function updateClock(dt) {
  state.worldClock += dt;
  if (state.worldClock >= 240) {
    state.worldClock = 0;
    addLog("Fajar baru menyinari dunia.");
  }
}

function updateAreaDiscovery(dt) {
  state.areaBanner.timer = Math.max(0, state.areaBanner.timer - dt);
  if (!state.player || !state.world) return;
  const hero = state.player;
  const zones = [
    { id: "coast", title: "Pesisir Neon", subtitle: "Awal perjalanan dan suara ombak bergerak", test: () => hero.x < state.world.oceanWidth + 180 },
    { id: "village", title: "Desa Arunika", subtitle: "Pemukiman hangat dengan misi pertama", test: () => hero.x > state.world.village.x - 80 && hero.x < state.world.village.x + state.world.village.w + 80 && hero.y > state.world.village.y - 80 && hero.y < state.world.village.y + state.world.village.h + 80 },
    { id: "city", title: "Grand City", subtitle: "Pusat kendaraan, festival, dan jalan besar", test: () => hero.x > state.world.city.x - 100 && hero.x < state.world.city.x + state.world.city.w + 120 && hero.y > state.world.city.y - 100 && hero.y < state.world.city.y + state.world.city.h + 120 },
    { id: "suburb", title: "Suburb Vale", subtitle: "Distrik rumah pribadi dan ritme santai", test: () => hero.x > state.world.suburb.x - 80 && hero.x < state.world.suburb.x + state.world.suburb.w + 80 && hero.y > state.world.suburb.y - 80 && hero.y < state.world.suburb.y + state.world.suburb.h + 80 },
    { id: "kingdom", title: "Kerajaan Aster", subtitle: "Tembok besar, guard, dan blacksmith", test: () => hero.x > state.world.kingdom.x - 80 && hero.x < state.world.kingdom.x + state.world.kingdom.w + 100 && hero.y > state.world.kingdom.y - 80 && hero.y < state.world.kingdom.y + state.world.kingdom.h + 120 },
    { id: "harbor", title: "Pelabuhan Azure", subtitle: "Boat, laut lebar, dan jalan menuju City2", test: () => hero.x < state.world.oceanWidth + 80 && hero.y > state.world.height * 0.56 }
  ];
  const area = zones.find((zone) => zone.test());
  if (!area || state.discoveredAreas[area.id]) return;
  state.discoveredAreas[area.id] = true;
  showAreaBanner(area.title, area.subtitle);
  addLog(`Area baru ditemukan: ${area.title}.`);
  saveGameState();
}

function updateCamera() {
  const shakeX = rand(-state.screenShake, state.screenShake);
  const shakeY = rand(-state.screenShake, state.screenShake);
  state.camera.x = clamp(state.player.x - canvas.width / 2 + shakeX, 0, state.world.width - canvas.width);
  state.camera.y = clamp(state.player.y - canvas.height / 2 + shakeY, 0, state.world.height - canvas.height);
}

function update(dt) {
  if (!state.running || !state.player) return;
  updateStory(dt);
  if (state.story.active) {
    updateFish(dt);
    updateEffects(dt);
    updateCamera();
    renderHud();
    return;
  }
  updateClock(dt);
  updateWeather(dt);
  updateWorldEvents(dt);
  updatePlayer(dt);
  updateCrowdLoop();
  updateAreaDiscovery(dt);
  updateCompanions(dt);
  updateCitizens(dt);
  updateTraffic(dt);
  updateVehicles(dt);
  updateAnimals(dt);
  updateMobs(dt);
  updateFish(dt);
  updateEffects(dt);
  state.combo.timer = Math.max(0, state.combo.timer - dt);
  if (state.combo.timer <= 0) state.combo.hits = 0;
  state.saveTimer += dt;
  if (state.saveTimer >= 3) {
    state.saveTimer = 0;
    saveGameState();
  }
  updateCamera();
  renderHud();
}

function themeSky() {
  if (state.launcher.theme === "sunset") return ["#ffcb8f", "#ff916f", "#5c72ff"];
  if (state.launcher.theme === "storm") return ["#8bb0d8", "#5c83aa", "#33486a"];
  return ["#b8ebff", "#7fd3ff", "#4097e6"];
}

function drawBackground() {
  const sky = themeSky();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, sky[0]);
  gradient.addColorStop(0.45, sky[1]);
  gradient.addColorStop(1, sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dusk = state.worldClock >= 96 && state.worldClock < 120;
  const dawn = state.worldClock >= 220;
  const dark = isNight()
    ? 0.72
    : dusk
      ? clamp((state.worldClock - 96) / 24, 0, 0.34)
      : dawn
        ? clamp(0.34 - ((state.worldClock - 220) / 20) * 0.34, 0, 0.34)
        : 0;
  if (dark > 0) {
    ctx.fillStyle = `rgba(9, 16, 30, ${dark})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (state.weather.type === "overcast") {
    ctx.fillStyle = "rgba(80, 95, 120, 0.16)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawNightLighting() {
  if (!isNight()) return;
  ctx.save();
  ctx.fillStyle = "rgba(4, 8, 16, 0.52)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const heroScreenX = state.player.x - state.camera.x;
  const heroScreenY = state.player.y - state.camera.y;
  const heroGlow = ctx.createRadialGradient(heroScreenX, heroScreenY, 18, heroScreenX, heroScreenY, 180);
  heroGlow.addColorStop(0, "rgba(255, 244, 196, 0.24)");
  heroGlow.addColorStop(0.35, "rgba(150, 220, 255, 0.12)");
  heroGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = heroGlow;
  ctx.beginPath();
  ctx.arc(heroScreenX, heroScreenY, 180, 0, Math.PI * 2);
  ctx.fill();

  const glows = [
    { x: state.world.city.x + state.world.city.w * 0.46, y: state.world.city.y + state.world.city.h * 0.46, r: 220, c: "rgba(255, 212, 120, 0.16)" },
    { x: state.world.village.x + state.world.village.w * 0.5, y: state.world.village.y + state.world.village.h * 0.55, r: 160, c: "rgba(255, 228, 170, 0.12)" },
    { x: state.world.suburb.x + state.world.suburb.w * 0.42, y: state.world.suburb.y + state.world.suburb.h * 0.42, r: 170, c: "rgba(255, 231, 173, 0.12)" },
    { x: state.world.kingdom.x + state.world.kingdom.w * 0.5, y: state.world.kingdom.y + state.world.kingdom.h * 0.52, r: 240, c: "rgba(255, 233, 170, 0.18)" },
    { x: state.world.bunker.x + state.world.bunker.w * 0.5, y: state.world.bunker.y + state.world.bunker.h * 0.5, r: 120, c: "rgba(120, 230, 255, 0.12)" }
  ];

  glows.forEach((glow) => {
    const x = glow.x - state.camera.x;
    const y = glow.y - state.camera.y;
    const radial = ctx.createRadialGradient(x, y, 16, x, y, glow.r);
    radial.addColorStop(0, glow.c);
    radial.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(x, y, glow.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawTerrain() {
  ctx.fillStyle = "#76c96a";
  ctx.fillRect(0, 0, state.world.width, state.world.height);
  ctx.fillStyle = "#9bd17f";
  for (let i = 0; i < 260; i += 1) {
    ctx.fillRect((i * 173) % state.world.width, (i * 97) % state.world.height, 8, 10);
    ctx.fillRect((i * 127 + 60) % state.world.width, (i * 111 + 40) % state.world.height, 4, 14);
  }
  state.world.roads.forEach((road) => {
    ctx.fillStyle = "#776f66";
    ctx.fillRect(road.x, road.y, road.w, road.h);
    ctx.fillStyle = "#f5e3a8";
    if (road.w > road.h) {
      for (let x = road.x + 18; x < road.x + road.w - 18; x += 46) {
        ctx.fillRect(x, road.y + road.h / 2 - 3, 24, 6);
      }
    } else {
      for (let y = road.y + 18; y < road.y + road.h - 18; y += 46) {
        ctx.fillRect(road.x + road.w / 2 - 3, y, 6, 24);
      }
    }
  });
  state.world.obstacles.forEach((obstacle) => {
    if (obstacle.type === "forest") {
      ctx.fillStyle = "#4e8d46";
      for (let i = 0; i < 14; i += 1) {
        ctx.beginPath();
        ctx.arc(obstacle.x + rand(0, obstacle.w), obstacle.y + rand(0, obstacle.h), rand(18, 28), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#8a8c9b";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    }
  });
}

function drawNature() {
  state.world.mountains.forEach((mountain, index) => {
    ctx.fillStyle = index % 2 === 0 ? "#71839b" : "#62758f";
    ctx.beginPath();
    ctx.moveTo(mountain.x, mountain.y + mountain.h);
    ctx.lineTo(mountain.x + mountain.w * 0.38, mountain.y);
    ctx.lineTo(mountain.x + mountain.w * 0.7, mountain.y + mountain.h * 0.45);
    ctx.lineTo(mountain.x + mountain.w, mountain.y + mountain.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.beginPath();
    ctx.moveTo(mountain.x + mountain.w * 0.28, mountain.y + mountain.h * 0.3);
    ctx.lineTo(mountain.x + mountain.w * 0.38, mountain.y);
    ctx.lineTo(mountain.x + mountain.w * 0.48, mountain.y + mountain.h * 0.24);
    ctx.closePath();
    ctx.fill();
  });
  state.world.trees.forEach((tree) => {
    ctx.fillStyle = "#6a4528";
    ctx.fillRect(tree.x - 4, tree.y, 8, tree.size + 8);
    ctx.fillStyle = "#3f8c45";
    ctx.beginPath();
    ctx.arc(tree.x, tree.y - 2, tree.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tree.x - tree.size * 0.45, tree.y + 4, tree.size * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tree.x + tree.size * 0.45, tree.y + 4, tree.size * 0.68, 0, Math.PI * 2);
    ctx.fill();
  });
  state.world.rocks.forEach((rock) => {
    ctx.fillStyle = "#8a8e93";
    ctx.beginPath();
    ctx.ellipse(rock.x, rock.y, rock.size, rock.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  state.world.farms.forEach((farm) => {
    ctx.fillStyle = farm.type === "wheat" ? "#cab45e" : "#6dae51";
    ctx.fillRect(farm.x, farm.y, farm.w, farm.h);
    ctx.strokeStyle = "rgba(90,60,34,0.35)";
    for (let x = farm.x + 14; x < farm.x + farm.w; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, farm.y);
      ctx.lineTo(x, farm.y + farm.h);
      ctx.stroke();
    }
  });
  state.world.barns.forEach((barn) => {
    ctx.fillStyle = "#9f4934";
    ctx.fillRect(barn.x, barn.y, barn.w, barn.h);
    ctx.fillStyle = "#723121";
    ctx.beginPath();
    ctx.moveTo(barn.x - 10, barn.y + 12);
    ctx.lineTo(barn.x + barn.w / 2, barn.y - 34);
    ctx.lineTo(barn.x + barn.w + 10, barn.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e8d7bd";
    ctx.fillRect(barn.x + barn.w / 2 - 16, barn.y + barn.h - 34, 32, 34);
  });
  state.world.caves.forEach((cave) => {
    ctx.fillStyle = "#4a4553";
    ctx.beginPath();
    ctx.arc(cave.x, cave.y, cave.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16131c";
    ctx.beginPath();
    ctx.ellipse(cave.x, cave.y + 12, cave.r * 0.62, cave.r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    drawNameTag(cave.label, cave.x, cave.y - cave.r - 24, "rgba(54,48,76,0.78)");
  });
  state.world.eventSpots.forEach((spot) => {
    ctx.fillStyle = spot.type === "market" ? "#d97b5b" : spot.type === "festival" ? "#8b61d9" : "#589a77";
    ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#fff1a8" : "#ffd0da";
      ctx.beginPath();
      ctx.arc(spot.x + 28 + i * 48, spot.y + 20, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawOcean() {
  const wave = Math.sin(performance.now() * 0.002) * 12;
  ctx.fillStyle = "#2f8fe4";
  ctx.fillRect(0, 0, state.world.oceanWidth + wave, state.world.height);
  ctx.fillStyle = "#6fd7ff";
  for (let i = 0; i < 48; i += 1) {
    const y = i * 40 + (Math.sin(performance.now() * 0.001 + i) * 8);
    ctx.fillRect(20 + (i % 6) * 90, y, 60, 4);
  }
  state.fish.forEach((fish) => {
    ctx.fillStyle = "#ffd97c";
    ctx.beginPath();
    ctx.ellipse(fish.x, fish.y, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(fish.x - 12 * fish.dir, fish.y - 2, 6 * fish.dir, 4);
  });
}

function drawAnimals() {
  state.animals.forEach((animal) => {
    if (animal.type === "bird") {
      ctx.strokeStyle = "#fff3c4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(animal.x - 8, animal.y);
      ctx.quadraticCurveTo(animal.x - 2, animal.y - 8, animal.x + 2, animal.y);
      ctx.quadraticCurveTo(animal.x + 8, animal.y - 8, animal.x + 14, animal.y);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = animal.type === "deer" ? "#a77b52" : animal.type === "mammoth" ? "#85725f" : animal.type === "whale" ? "#5b7da5" : "#f2f0df";
    ctx.beginPath();
    ctx.ellipse(animal.x, animal.y, animal.radius, animal.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = animal.type === "deer" ? "#8a603e" : animal.type === "mammoth" ? "#6b5848" : animal.type === "whale" ? "#47698e" : "#d9d4c2";
    ctx.beginPath();
    ctx.arc(animal.x + animal.radius * 0.8, animal.y - 4, animal.radius * 0.44, 0, Math.PI * 2);
    ctx.fill();
    if (animal.type === "mammoth") {
      ctx.strokeStyle = "#f3ead6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(animal.x + 10, animal.y + 6, 14, Math.PI * 1.1, Math.PI * 1.8);
      ctx.stroke();
    }
    if (animal.type === "whale") {
      ctx.fillRect(animal.x - animal.radius - 10, animal.y - 5, 18, 10);
    }
  });
}

function drawSettlementHouses(prefix) {
  state.world.houses.filter((house) => house.district.startsWith(prefix)).forEach((house) => {
    ctx.fillStyle = house.color;
    ctx.fillRect(house.x, house.y, house.w, house.h);
    ctx.fillStyle = "#7f4024";
    ctx.beginPath();
    ctx.moveTo(house.x - 10, house.y + 20);
    ctx.lineTo(house.x + house.w / 2, house.y - 34);
    ctx.lineTo(house.x + house.w + 10, house.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f0f4ff";
    ctx.fillRect(house.x + 18, house.y + 26, 22, 18);
    ctx.fillRect(house.x + house.w - 42, house.y + 26, 22, 18);
    ctx.fillStyle = "#60351f";
    ctx.fillRect(house.x + house.w / 2 - 10, house.y + house.h - 28, 20, 28);
  });
}

function drawVillage() {
  state.world.villages.forEach((area, index) => {
    ctx.fillStyle = index === 0 ? "#b5a173" : index === 1 ? "#a7966e" : "#b59a78";
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.fillStyle = "rgba(255,245,220,0.15)";
    ctx.fillRect(area.x + 12, area.y + 12, area.w - 24, area.h - 24);
  });
  drawSettlementHouses("village");
}

function drawCity() {
  ctx.fillStyle = "#66758d";
  ctx.fillRect(state.world.city.x, state.world.city.y, state.world.city.w, state.world.city.h);
  ctx.fillStyle = "#4d5a70";
  ctx.fillRect(state.world.city.x + state.world.city.w * 0.43, state.world.city.y, 90, state.world.city.h);
  ctx.fillRect(state.world.city.x, state.world.city.y + state.world.city.h * 0.42, state.world.city.w, 82);
  state.world.cityBlocks.forEach((block, index) => {
    const bx = block.x;
    const by = block.y;
    const bw = block.w;
    const bh = block.h;
    ctx.fillStyle = block.color;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#2a3550";
    for (let wx = 0; wx < 3; wx += 1) {
      for (let wy = 0; wy < 4; wy += 1) {
        ctx.fillRect(bx + 10 + wx * 18, by + 10 + wy * 18, 10, 12);
      }
    }
    if (index % 5 === 0) {
      ctx.fillStyle = "#95d07b";
      ctx.fillRect(bx + 8, by + bh - 20, bw - 16, 12);
    }
  });
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(state.world.city.x + 26, state.world.city.y + 26, state.world.city.w - 52, state.world.city.h - 52);
  state.world.interiors.filter((entry) => entry.district === "city").forEach((entry) => {
    ctx.strokeStyle = "#fff2a8";
    ctx.lineWidth = 3;
    ctx.strokeRect(entry.x, entry.y, entry.w, entry.h);
  });
}

function drawSuburb() {
  ctx.fillStyle = "#bda988";
  ctx.fillRect(state.world.suburb.x, state.world.suburb.y, state.world.suburb.w, state.world.suburb.h);
  state.world.houses.filter((house) => house.district === "suburb").forEach((house) => {
    ctx.fillStyle = house.color;
    ctx.fillRect(house.x, house.y, house.w, house.h);
    ctx.fillStyle = house.purchased ? "#8cff9d" : "#f7f0d2";
    ctx.fillRect(house.x + 20, house.y + 20, 24, 16);
    ctx.fillRect(house.x + house.w - 46, house.y + 20, 24, 16);
  });
  state.world.interiors.filter((entry) => entry.district === "suburb").forEach((entry) => {
    ctx.strokeStyle = "#ffe7a1";
    ctx.lineWidth = 3;
    ctx.strokeRect(entry.x, entry.y, entry.w, entry.h);
  });
}

function drawKingdom() {
  ctx.fillStyle = "#d8dbe7";
  ctx.fillRect(state.world.kingdom.x, state.world.kingdom.y, state.world.kingdom.w, state.world.kingdom.h);
  ctx.fillStyle = "#8a90b2";
  ctx.fillRect(state.world.kingdom.x + 30, state.world.kingdom.y + 40, state.world.kingdom.w - 60, state.world.kingdom.h - 70);
  ctx.fillStyle = "#b7bed7";
  ctx.fillRect(state.world.kingdom.x - 30, state.world.kingdom.y + state.world.kingdom.h, state.world.kingdom.w + 60, 110);
  ctx.fillStyle = "#7180a0";
  ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w * 0.5 - 44, state.world.kingdom.y + 58, 88, state.world.kingdom.h - 108);
  ctx.fillStyle = "#4a5773";
  ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w * 0.5 - 60, state.world.kingdom.y + state.world.kingdom.h + 8, 120, 86);
  ctx.fillStyle = "#39455f";
  ctx.fillRect(state.world.kingdom.x + 58, state.world.kingdom.y + 96, 72, 138);
  ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w - 130, state.world.kingdom.y + 96, 72, 138);
  ctx.fillStyle = "#6a7090";
  const towers = [
    [state.world.kingdom.x + 20, state.world.kingdom.y + 20],
    [state.world.kingdom.x + state.world.kingdom.w - 60, state.world.kingdom.y + 20],
    [state.world.kingdom.x + 20, state.world.kingdom.y + state.world.kingdom.h - 80],
    [state.world.kingdom.x + state.world.kingdom.w - 60, state.world.kingdom.y + state.world.kingdom.h - 80]
  ];
  towers.forEach(([x, y]) => {
    ctx.fillRect(x, y, 40, 60);
    ctx.fillStyle = "#f2d77b";
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 8);
    ctx.lineTo(x + 20, y - 22);
    ctx.lineTo(x + 48, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6a7090";
  });
  ctx.fillStyle = "#dfe7f6";
  for (let rx = 0; rx < 3; rx += 1) {
    for (let ry = 0; ry < 5; ry += 1) {
      ctx.fillRect(state.world.kingdom.x + 72 + rx * 28, state.world.kingdom.y + 114 + ry * 22, 12, 15);
      ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w - 118 + rx * 16, state.world.kingdom.y + 114 + ry * 22, 10, 15);
    }
  }
  ctx.fillStyle = isNight() ? "#ffd76b" : "#f4f8ff";
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w * 0.5 - 48 + i * 24, state.world.kingdom.y + 92, 12, 22);
  }
  ctx.fillStyle = "#607293";
  ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w * 0.5 - 16, state.world.kingdom.y + state.world.kingdom.h - 18, 32, 18);
  ctx.fillStyle = "#f1d16e";
  ctx.beginPath();
  ctx.moveTo(state.world.kingdom.x + state.world.kingdom.w * 0.5 - 12, state.world.kingdom.y + 58);
  ctx.lineTo(state.world.kingdom.x + state.world.kingdom.w * 0.5, state.world.kingdom.y + 26);
  ctx.lineTo(state.world.kingdom.x + state.world.kingdom.w * 0.5 + 12, state.world.kingdom.y + 58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c9b06d";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(state.world.kingdom.x - 6 + i * 32, state.world.kingdom.y + state.world.kingdom.h + 18, 10, 36);
    ctx.fillRect(state.world.kingdom.x + state.world.kingdom.w - 164 + i * 32, state.world.kingdom.y + state.world.kingdom.h + 18, 10, 36);
  }
  state.world.interiors.filter((entry) => entry.district === "kingdom").forEach((entry) => {
    ctx.strokeStyle = "#fff1a6";
    ctx.lineWidth = 3;
    ctx.strokeRect(entry.x, entry.y, entry.w, entry.h);
  });
}

function drawHarbor() {
  const harbor = state.world.obstacles.find((entry) => entry.type === "harbor");
  if (!harbor) return;
  ctx.fillStyle = "#9c7d58";
  ctx.fillRect(harbor.x, harbor.y, harbor.w, harbor.h);
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(harbor.x + 20 + i * 36, harbor.y + harbor.h - 18, 16, 50);
  }
  ctx.fillStyle = "#d9c08e";
  ctx.fillRect(harbor.x + 24, harbor.y + 26, 80, 44);
  ctx.fillRect(harbor.x + 132, harbor.y + 44, 92, 36);
}

function drawTransitAndBunker() {
  const bunker = state.world.bunker;
  ctx.fillStyle = "#6a767e";
  ctx.fillRect(bunker.x, bunker.y, bunker.w, bunker.h);
  ctx.fillStyle = "#222d34";
  ctx.fillRect(bunker.x + 18, bunker.y + 28, bunker.w - 36, bunker.h - 28);
  ctx.fillStyle = "#d7e8f0";
  ctx.fillRect(bunker.x + bunker.w / 2 - 18, bunker.y + bunker.h - 30, 36, 30);
  drawNameTag(bunker.label, bunker.x + bunker.w / 2, bunker.y - 24, "rgba(55,72,84,0.82)");

  const bus = state.world.busStop;
  ctx.fillStyle = "#f0c64f";
  ctx.fillRect(bus.x, bus.y, bus.w, bus.h);
  ctx.fillStyle = "#2b3a52";
  ctx.fillRect(bus.x + 16, bus.y + 14, bus.w - 32, 28);
  ctx.fillRect(bus.x + 26, bus.y + 48, 28, 18);
  ctx.fillRect(bus.x + bus.w - 54, bus.y + 48, 28, 18);
  drawNameTag(bus.label, bus.x + bus.w / 2, bus.y - 24, "rgba(140,108,26,0.84)");
}

function drawDungeon() {
  ctx.fillStyle = "#3e3659";
  ctx.beginPath();
  ctx.arc(state.world.dungeon.x, state.world.dungeon.y, state.world.dungeon.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8c78c4";
  ctx.beginPath();
  ctx.arc(state.world.dungeon.x, state.world.dungeon.y, 38 + Math.sin(performance.now() * 0.004) * 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawVehicles() {
  state.vehicles.forEach((vehicle) => {
    const img = vehicleImages[vehicle.type];
    if (img && img.complete && img.naturalWidth > 0) {
      const size = vehicle.type === "boat" ? 72 : vehicle.type === "car" ? 80 : vehicle.type === "jeep" ? 84 : vehicle.type === "hover" ? 76 : 64;
      ctx.globalAlpha = vehicle.autopilot ? 0.95 : vehicle.owned ? 1 : 0.72;
      ctx.drawImage(img, vehicle.x - size / 2, vehicle.y - size / 2, size, size);
      ctx.globalAlpha = 1;
      if (vehicle.autopilot && vehicle.driverKey) {
        drawCharacterSprite(vehicle.driverKey, vehicle.x, vehicle.y - 6, 10, "#ffffff");
      }
    } else {
      ctx.fillStyle = vehicle.owned ? "#9cf18b" : "#8ca37c";
      ctx.fillRect(vehicle.x - 18, vehicle.y - 8, 36, 16);
      ctx.fillStyle = "#20293a";
      ctx.fillRect(vehicle.x - 6, vehicle.y - 18, 12, 22);
    }
  });
}

function drawTrafficLights() {
  state.trafficLights.forEach((light) => {
    ctx.fillStyle = "#3f464d";
    ctx.fillRect(light.x - 4, light.y - 24, 8, 44);
    ctx.fillStyle = "#1b2026";
    ctx.fillRect(light.x - 12, light.y - 42, 24, 32);
    const colors = ["red", "yellow", "green"];
    colors.forEach((color, index) => {
      ctx.fillStyle = light.state === color
        ? color === "red" ? "#ff6258" : color === "yellow" ? "#ffd35c" : "#76ef7a"
        : "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(light.x, light.y - 34 + index * 10, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function drawCharacterSprite(imageKey, x, y, radius, fallbackColor) {
  const img = characterImages[imageKey];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }
  ctx.fillStyle = fallbackColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawNameTag(label, x, y, tone = "rgba(10,18,34,0.75)") {
  const width = Math.max(70, label.length * 8.5);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, width, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#f8fdff";
  ctx.font = "12px 'Space Grotesk'";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 15);
  ctx.textAlign = "left";
}

function drawNpcs() {
  state.npcs.forEach((npc) => {
    drawCharacterSprite(npc.imageKey, npc.x, npc.y, npc.radius, npc.color);
    drawNameTag(npc.name, npc.x, npc.y - npc.radius - 26, npc.role === "guard" ? "rgba(80,120,170,0.78)" : "rgba(10,18,34,0.75)");
  });
  state.citizens.forEach((npc) => {
    drawCharacterSprite(npc.imageKey, npc.x, npc.y, npc.radius, npc.color);
    drawNameTag(npc.name, npc.x, npc.y - npc.radius - 24, "rgba(44,66,38,0.72)");
  });
}

function drawCompanions() {
  state.companions.filter((companion) => companion.recruited).forEach((companion) => {
    drawCharacterSprite(companion.imageKey, companion.x, companion.y, companion.radius, companion.tint);
    drawNameTag(companion.name, companion.x, companion.y - companion.radius - 24, "rgba(110,84,32,0.75)");
  });
}

function drawMobs() {
  state.mobs.forEach((mob) => {
    const img = enemyImages[mob.type];
    if (img && img.complete && img.naturalWidth > 0) {
      const size = mob.type === "raider" ? 58 : 52;
      ctx.drawImage(img, mob.x - size / 2, mob.y - size / 2, size, size);
    } else {
      ctx.fillStyle = mob.type === "raider" ? "#bf5d55" : mob.type === "shade" ? "#6b5ea5" : "#76995c";
      ctx.beginPath();
      ctx.arc(mob.x, mob.y, mob.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#111827";
    ctx.fillRect(mob.x - mob.radius, mob.y - mob.radius - 10, mob.radius * 2, 5);
    ctx.fillStyle = "#ff9a88";
    ctx.fillRect(mob.x - mob.radius, mob.y - mob.radius - 10, (mob.hp / mob.maxHp) * mob.radius * 2, 5);
  });
}

function drawPlayer() {
  const hero = state.player;
  if (!hero) return;
  const body = hero.hurt > 0 ? "#ffd8d8" : "#69c8ff";
  drawCharacterSprite("karakter", hero.x, hero.y, hero.radius, hero.mounted ? "#e7f1a6" : body);
  if (hero.mounted) {
    ctx.strokeStyle = hero.mounted.type === "hover" ? "#8ef1ff" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hero.x, hero.y + 10, hero.mounted.type === "boat" ? 30 : 24, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEffects() {
  state.effects.forEach((effect) => {
    ctx.save();
    ctx.globalAlpha = clamp(effect.life * 3, 0, 1);
    if (effect.type === "slash") {
      ctx.strokeStyle = "#fff0a0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, effect.facing - 0.6, effect.facing + 0.6);
      ctx.stroke();
    } else if (effect.type === "ring") {
      ctx.strokeStyle = "#9cf8ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === "lightning") {
      ctx.strokeStyle = "#fefefe";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(effect.x, 0);
      ctx.lineTo(effect.x - 18, 120);
      ctx.lineTo(effect.x + 12, 210);
      ctx.lineTo(effect.x - 8, 330);
      ctx.stroke();
    } else {
      ctx.strokeStyle = effect.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawWeatherOverlay() {
  if (state.weather.type === "clear" || state.weatherLevel === "off") return;
  if (state.weather.type === "overcast") {
    ctx.fillStyle = "rgba(90, 105, 128, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const density = state.weatherLevel === "light" ? 24 : 48;
  ctx.strokeStyle = state.weather.type === "storm" ? "rgba(210,230,255,0.55)" : "rgba(220,240,255,0.34)";
  for (let i = 0; i < density; i += 1) {
    const x = (i * 77 + performance.now() * 0.3) % canvas.width;
    const y = (i * 43 + performance.now() * 0.7) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y + 22);
    ctx.stroke();
  }
  if (state.weather.type === "tornado") {
    ctx.strokeStyle = "rgba(240, 245, 255, 0.42)";
    for (let i = 0; i < 2; i += 1) {
      const baseX = canvas.width * (0.3 + i * 0.36);
      ctx.beginPath();
      for (let step = 0; step < 20; step += 1) {
        const t = step / 19;
        const x = baseX + Math.sin(performance.now() * 0.003 + step * 0.9) * (14 + t * 46);
        const y = 100 + t * (canvas.height - 180);
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  if (state.weather.type === "flood") {
    ctx.fillStyle = "rgba(80, 160, 220, 0.14)";
    ctx.fillRect(0, canvas.height * 0.56, canvas.width, canvas.height * 0.44);
  }
}

function drawInteriorOverlay() {
  if (!state.interior) return;
  const house = state.interior;
  const compact = isCompactViewport();
  const panelW = compact ? Math.min(360, canvas.width - 48) : 440;
  const panelH = compact ? 224 : 280;
  ctx.fillStyle = "rgba(6, 10, 18, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const panelX = (canvas.width - panelW) / 2;
  const panelY = (canvas.height - panelH) / 2;
  ctx.fillStyle = "#d7c29f";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle = "#926f4a";
  ctx.fillRect(panelX + 20, panelY + 22, compact ? 94 : 120, compact ? 54 : 70);
  ctx.fillRect(panelX + panelW - (compact ? 108 : 140), panelY + 24, compact ? 84 : 100, compact ? 36 : 42);
  ctx.fillRect(panelX + panelW - (compact ? 128 : 154), panelY + panelH - (compact ? 72 : 96), compact ? 100 : 120, compact ? 44 : 54);
  ctx.fillStyle = "#6b4b2f";
  ctx.fillRect(panelX + panelW / 2 - 36, panelY + panelH - (compact ? 56 : 66), 72, compact ? 46 : 66);
  ctx.fillStyle = "#fff4db";
  ctx.font = `${compact ? 14 : 16}px 'Space Grotesk'`;
  ctx.fillText(house.interiorLabel || "Interior Rumah", panelX + 24, panelY + panelH - 18);
  ctx.fillText("F untuk keluar", panelX + panelW - (compact ? 112 : 140), panelY + panelH - 18);
}

function drawMinimap() {
  if (!state.world || !state.player || state.story.active) return;
  const compact = isCompactViewport();
  const mapW = compact ? 132 : 180;
  const mapH = compact ? 90 : 118;
  const mapX = canvas.width - mapW - (compact ? 12 : 18);
  const mapY = compact ? 12 : canvas.height - mapH - 108;
  const sx = mapW / state.world.width;
  const sy = mapH / state.world.height;

  ctx.save();
  ctx.fillStyle = "rgba(7, 14, 24, 0.68)";
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 220, 255, 0.28)";
  ctx.strokeRect(mapX + 8, mapY + 8, mapW - 16, mapH - 16);

  ctx.fillStyle = "#5ca1d9";
  ctx.fillRect(mapX + 8, mapY + 8, state.world.oceanWidth * sx, mapH - 16);
  ctx.fillStyle = "#628855";
  ctx.fillRect(mapX + 8 + state.world.oceanWidth * sx, mapY + 8, (state.world.width - state.world.oceanWidth) * sx - 8, mapH - 16);

  ctx.fillStyle = "#d6bd7d";
  ctx.fillRect(mapX + 8 + state.world.city.x * sx, mapY + 8 + state.world.city.y * sy, state.world.city.w * sx, state.world.city.h * sy);
  ctx.fillRect(mapX + 8 + state.world.village.x * sx, mapY + 8 + state.world.village.y * sy, state.world.village.w * sx, state.world.village.h * sy);
  ctx.fillStyle = "#e7d8c8";
  ctx.fillRect(mapX + 8 + state.world.kingdom.x * sx, mapY + 8 + state.world.kingdom.y * sy, state.world.kingdom.w * sx, state.world.kingdom.h * sy);

  const activeQuest = state.quests.find((quest) => quest.active && !quest.done);
  let marker = null;
  if (activeQuest?.id === "elder") marker = { x: state.world.village.x + 90, y: state.world.village.y + 120 };
  else if (activeQuest?.id === "city") marker = { x: state.world.city.x + 120, y: state.world.city.y + 110 };
  else if (activeQuest?.id === "kingdom") marker = { x: state.world.kingdom.x + 120, y: state.world.kingdom.y + 120 };
  else if (activeQuest?.id === "dungeon") marker = { x: state.world.dungeon.x, y: state.world.dungeon.y };
  if (marker) {
    ctx.fillStyle = "#ffd76b";
    ctx.beginPath();
    ctx.arc(mapX + 8 + marker.x * sx, mapY + 8 + marker.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#89f0ff";
  ctx.beginPath();
  ctx.arc(mapX + 8 + state.player.x * sx, mapY + 8 + state.player.y * sy, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f6fbff";
  ctx.font = `${compact ? 9 : 11}px 'Press Start 2P'`;
  ctx.fillText("MAP", mapX + 14, mapY + (compact ? 18 : 22));
  ctx.restore();
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) {
    lines.push(line);
  }
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[. ]+$/, "")}...`;
  }
  lines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
}

function drawShopOverlay() {
  if (!state.shop.active) return;
  const compact = isCompactViewport();
  const panelW = Math.min(compact ? 420 : 620, canvas.width - (compact ? 28 : 90));
  const panelH = compact ? 300 : 340;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = (canvas.height - panelH) / 2;
  const item = state.shop.items[state.shop.index];

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 18, 0.66)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(10, 18, 34, 0.92)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "rgba(126, 222, 255, 0.36)";
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = "#89f0ff";
  ctx.font = `${compact ? 10 : 12}px 'Press Start 2P'`;
  ctx.fillText("SHOP", panelX + 20, panelY + 28);
  ctx.fillStyle = "#fff8dc";
  ctx.font = `700 ${compact ? 20 : 24}px 'Space Grotesk'`;
  ctx.fillText(state.shop.npcName, panelX + 20, panelY + (compact ? 58 : 72));
  ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
  ctx.fillStyle = "#d7e9ff";
  ctx.fillText(compact ? "W/S pilih | F beli | Esc tutup" : "W/S pilih item  |  F beli  |  Esc tutup", panelX + 20, panelY + (compact ? 78 : 96));

  state.shop.items.forEach((entry, index) => {
    const rowH = compact ? 42 : 48;
    const y = panelY + (compact ? 96 : 126) + index * rowH;
    ctx.fillStyle = index === state.shop.index ? "rgba(255,215,107,0.18)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(panelX + 18, y, panelW - 36, compact ? 34 : 38);
    ctx.fillStyle = "#f5fbff";
    ctx.font = `700 ${compact ? 14 : 16}px 'Space Grotesk'`;
    ctx.fillText(entry.label, panelX + 30, y + (compact ? 22 : 24));
    ctx.fillStyle = "#ffd76b";
    ctx.fillText(`${entry.price} G`, panelX + panelW - (compact ? 88 : 100), y + (compact ? 22 : 24));
  });

  if (item) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(panelX + 18, panelY + panelH - (compact ? 74 : 86), panelW - 36, compact ? 44 : 54);
    ctx.fillStyle = "#dbeaff";
    ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
    drawWrappedText(item.description, panelX + 30, panelY + panelH - (compact ? 48 : 52), panelW - 70, compact ? 14 : 16, compact ? 2 : 3);
  }
  ctx.restore();
}

function drawPill(x, y, w, h, color, text, align = "left") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.fillStyle = "#eff8ff";
  ctx.font = `${h <= 22 ? 12 : 15}px 'Space Grotesk'`;
  ctx.textAlign = align;
  ctx.fillText(text, align === "right" ? x + w - 14 : x + 14, y + h / 2 + 5);
  ctx.textAlign = "left";
}

function drawGameOverlay() {
  if (state.story.active) return;
  const hero = state.player;
  if (!hero) return;
  const compact = isCompactViewport();
  const leftCardW = compact ? 222 : 278;
  const leftCardH = compact ? 64 : 72;
  const objectiveW = compact ? Math.min(canvas.width - 24, 250) : 380;
  const rightCardW = compact ? 186 : 268;
  const rightCardH = compact ? 42 : 48;
  const logW = compact ? Math.min(canvas.width - 24, 320) : 480;
  const bottomY = canvas.height - (compact ? 126 : 62);
  ctx.save();
  ctx.fillStyle = "rgba(7, 14, 24, 0.5)";
  ctx.beginPath();
  ctx.roundRect(12, 12, leftCardW, leftCardH, 20);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(12, compact ? 84 : 100, objectiveW, compact ? 42 : 48, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(canvas.width - rightCardW - 12, 12, rightCardW, rightCardH, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(canvas.width - rightCardW - 12, compact ? 60 : 74, rightCardW, rightCardH, 18);
  ctx.fill();

  ctx.fillStyle = "#16263a";
  ctx.beginPath();
  ctx.roundRect(24, compact ? 26 : 34, compact ? 92 : 120, 12, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(24, compact ? 48 : 60, compact ? 92 : 120, 12, 10);
  ctx.fill();
  ctx.fillStyle = "#ff7b77";
  ctx.beginPath();
  ctx.roundRect(24, compact ? 26 : 34, (compact ? 92 : 120) * (hero.health / hero.maxHealth), 12, 10);
  ctx.fill();
  ctx.fillStyle = "#65dcff";
  ctx.beginPath();
  ctx.roundRect(24, compact ? 48 : 60, (compact ? 92 : 120) * (hero.energy / hero.maxEnergy), 12, 10);
  ctx.fill();

  ctx.fillStyle = "#f6fbff";
  ctx.font = `700 ${compact ? 13 : 15}px 'Space Grotesk'`;
  ctx.fillText(hero.name, compact ? 126 : 166, compact ? 34 : 42);
  ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
  ctx.fillStyle = "#d6e9ff";
  ctx.fillText(`${Math.ceil(hero.health)} HP`, compact ? 126 : 166, compact ? 52 : 62);
  if (compact) {
    ctx.fillText(hero.mounted ? `Naik ${hero.mounted.type}` : "Jelajah", 126, 68);
  } else {
    ctx.fillText(`${Math.ceil(hero.energy)} EN`, 230, 62);
    ctx.fillText(hero.mounted ? `Naik ${hero.mounted.type}` : "Jelajah", 166, 82);
  }

  const activeQuest = state.quests.find((quest) => quest.active && !quest.done);
  const latestLog = state.log[0] || "Dunia tenang untuk sesaat.";
  const nearbyVehicle = state.vehicles.find((vehicle) => dist(vehicle, hero) < 84 && !vehicle.autopilot);
  const nearbyNpc = [...state.npcs, ...state.citizens].find((npc) => dist(npc, hero) < 90);
  const nearbyHouse = !state.interior ? getNearbyHouse() : null;
  const nearbyBunker = !state.interior ? getNearbyBunker() : null;
  const nearbyBusStop = !state.interior ? getNearbyBusStop() : null;
  drawPill(20, compact ? 92 : 110, compact ? objectiveW - 16 : 356, compact ? 24 : 28, "rgba(122, 218, 255, 0.2)", activeQuest ? activeQuest.title : "Semua objektif selesai");
  drawPill(canvas.width - rightCardW + (compact ? -2 : 12), compact ? 22 : 30, compact ? rightCardW - 22 : 244, compact ? 22 : 24, "rgba(255, 213, 107, 0.18)", `${isNight() ? "Malam" : "Siang"} | ${state.weatherLabel || state.weather.type}`, "right");
  drawPill(canvas.width - rightCardW + (compact ? -2 : 12), compact ? 68 : 86, compact ? rightCardW - 22 : 244, compact ? 22 : 24, "rgba(255,255,255,0.12)", `Gold ${state.inventory.gold || 0} | ${ITEM_LABELS[state.hotbar[state.selectedSlot]] || "Item"}`, "right");
  if (state.combo.hits > 0) {
    drawPill(compact ? 20 : 408, compact ? 122 : 110, compact ? 128 : 164, compact ? 22 : 28, "rgba(255,120,120,0.2)", `Combo ${state.combo.hits}x`);
  }
  if (state.worldEvent) {
    drawPill(compact ? 154 : 590, compact ? 122 : 110, compact ? Math.min(canvas.width - 174, 170) : 260, compact ? 22 : 28, "rgba(190,120,255,0.18)", `Event: ${state.worldEvent.title} (${Math.ceil(state.worldEvent.timer)}s)`);
  }

  ctx.fillStyle = "rgba(6, 10, 18, 0.42)";
  ctx.beginPath();
  ctx.roundRect(12, bottomY, logW, compact ? 32 : 34, 16);
  ctx.fill();
  ctx.fillStyle = "#f6fbff";
  ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
  drawWrappedText(latestLog, 24, bottomY + 20, logW - 24, 13, compact ? 1 : 2);

  const prompt = state.interior
    ? "Tekan F untuk keluar rumah"
    : nearbyBunker
      ? "Tekan F untuk masuk bunker"
      : nearbyBusStop
        ? "Tekan F untuk naik bus"
        : nearbyVehicle
          ? `Tekan F untuk naik ${nearbyVehicle.type}`
          : nearbyNpc
            ? `Tekan E untuk bicara dengan ${nearbyNpc.name}`
            : nearbyHouse
              ? "Tekan F untuk masuk rumah"
              : "";
  if (prompt) {
    ctx.fillStyle = "rgba(6, 10, 18, 0.58)";
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - (compact ? 132 : 160), canvas.height - (compact ? 74 : 82), compact ? 264 : 320, compact ? 30 : 34, 16);
    ctx.fill();
    ctx.fillStyle = "#fff2b6";
    ctx.textAlign = "center";
    ctx.fillText(prompt, canvas.width / 2, canvas.height - (compact ? 53 : 59));
    ctx.textAlign = "left";
  }

  if (state.areaBanner.timer > 0) {
    const width = compact ? Math.min(canvas.width - 24, 280) : 360;
    ctx.fillStyle = "rgba(8, 16, 28, 0.72)";
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - width / 2, compact ? 112 : 28, width, compact ? 54 : 62, 18);
    ctx.fill();
    ctx.fillStyle = "#89f0ff";
    ctx.font = `${compact ? 9 : 12}px 'Press Start 2P'`;
    ctx.textAlign = "center";
    ctx.fillText("AREA DISCOVERED", canvas.width / 2, compact ? 130 : 50);
    ctx.fillStyle = "#fff8db";
    ctx.font = `700 ${compact ? 16 : 18}px 'Space Grotesk'`;
    ctx.fillText(state.areaBanner.title, canvas.width / 2, compact ? 148 : 70);
    ctx.fillStyle = "#d8eaff";
    ctx.font = `${compact ? 11 : 13}px 'Space Grotesk'`;
    ctx.fillText(state.areaBanner.subtitle, canvas.width / 2, compact ? 162 : 86);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function drawStoryOverlay() {
  if (!state.story.active) return;
  const scene = state.story.lines[state.story.index];
  if (!scene) return;
  const compact = isCompactViewport();

  ctx.save();
  ctx.fillStyle = "rgba(3, 8, 18, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelWidth = Math.min(compact ? canvas.width - 24 : 920, canvas.width - (compact ? 24 : 80));
  const panelHeight = compact ? 190 : 230;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = canvas.height - panelHeight - (compact ? 18 : 42);

  const panel = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
  panel.addColorStop(0, "rgba(8, 18, 35, 0.92)");
  panel.addColorStop(1, "rgba(20, 39, 66, 0.88)");
  ctx.fillStyle = panel;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  ctx.strokeStyle = "rgba(128, 220, 255, 0.48)";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  ctx.fillStyle = "#89f0ff";
  ctx.font = `${compact ? 9 : 12}px 'Press Start 2P'`;
  ctx.fillText("CORECHIPER STORY", panelX + 18, panelY + 26);

  ctx.fillStyle = "#fff7d9";
  ctx.font = `${compact ? 22 : 28}px 'Space Grotesk'`;
  ctx.fillText(scene.title, panelX + 18, panelY + (compact ? 56 : 76));

  const lines = scene.text.split("\n");
  ctx.fillStyle = "#dcecff";
  ctx.font = `${compact ? 16 : 20}px 'Space Grotesk'`;
  lines.forEach((line, index) => {
    ctx.fillText(line, panelX + 18, panelY + (compact ? 90 : 122) + index * (compact ? 24 : 34));
  });

  const progress = (state.story.index + 1) / state.story.lines.length;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(panelX + 28, panelY + panelHeight - 34, panelWidth - 56, 10);
  ctx.fillStyle = "#6cf3ff";
  ctx.fillRect(panelX + 28, panelY + panelHeight - 34, (panelWidth - 56) * progress, 10);

  const nextIn = Math.max(0, state.story.autoAdvance - state.story.timer);
  ctx.fillStyle = "#a8cfff";
  ctx.font = `${compact ? 12 : 16}px 'Space Grotesk'`;
  ctx.fillText(compact ? `F / Enter lanjut | ${nextIn.toFixed(1)} dtk` : `Tekan Space / Enter / F untuk lanjut  |  ${nextIn.toFixed(1)} dtk`, panelX + 18, panelY + panelHeight - 50);
  ctx.restore();
}

function drawWorld() {
  drawBackground();
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);
  drawTerrain();
  drawNature();
  drawOcean();
  drawHarbor();
  drawTransitAndBunker();
  drawVillage();
  drawCity();
  drawSuburb();
  drawKingdom();
  drawDungeon();
  drawTrafficLights();
  drawAnimals();
  drawVehicles();
  drawNpcs();
  drawCompanions();
  drawMobs();
  drawPlayer();
  drawEffects();
  ctx.restore();
  drawNightLighting();
  drawWeatherOverlay();
  drawInteriorOverlay();
  drawGameOverlay();
  drawMinimap();
  drawShopOverlay();
  drawStoryOverlay();
}

function render() {
  if (!state.world) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld();
}

function playNote(startAt, frequency, duration, type, gainValue) {
  const osc = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(state.audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.04);
  state.musicNodes.push(osc, gain);
}

function playMusic() {
  if (!state.musicEnabled || !state.audioCtx) return;
  const start = state.audioCtx.currentTime + 0.04;
  const lead = [220, 261.63, 329.63, 392, 349.23, 329.63, 293.66, 261.63];
  const bass = [110, 130.81, 164.81, 196, 174.61, 164.81, 146.83, 130.81];
  lead.forEach((note, index) => {
    const t = start + index * 0.42;
    playNote(t, note, 0.3, "square", 0.024);
    playNote(t, bass[index], 0.34, "triangle", 0.016);
  });
  state.musicLoop = window.setTimeout(playMusic, lead.length * 420);
}

function stopMusic() {
  clearTimeout(state.musicLoop);
  state.musicNodes.forEach((node) => {
    try { node.disconnect(); } catch (error) { /* ignore */ }
  });
  state.musicNodes = [];
}

function stopVehicleLoop() {
  if (!state.vehicleLoop) return;
  try {
    state.vehicleLoop.pause();
    state.vehicleLoop.currentTime = 0;
  } catch (error) { /* ignore */ }
  state.vehicleLoop = null;
}

function startVehicleLoop(type) {
  stopVehicleLoop();
  const src = AUDIO_FILES[`vehicle-${type}`];
  if (!src || !state.musicEnabled) return false;
  const loop = new Audio(src);
  loop.preload = "auto";
  loop.loop = true;
  loop.volume = 0.6;
  state.vehicleLoop = loop;
  loop.play().catch(() => {});
  return true;
}

function stopCrowdLoop() {
  if (!state.crowdLoop) return;
  try {
    state.crowdLoop.pause();
    state.crowdLoop.currentTime = 0;
  } catch (error) { /* ignore */ }
  state.crowdLoop = null;
}

function updateCrowdLoop() {
  if (!state.musicEnabled || !state.player || !state.world) {
    stopCrowdLoop();
    return;
  }
  const inCity = state.player.x > state.world.city.x - 120
    && state.player.x < state.world.city.x + state.world.city.w + 120
    && state.player.y > state.world.city.y - 120
    && state.player.y < state.world.city.y + state.world.city.h + 180;
  const nearFestival = state.world.eventSpots.some((spot) => dist(state.player, { x: spot.x + spot.w / 2, y: spot.y + spot.h / 2 }) < 220);
  const shouldPlay = inCity || nearFestival;
  if (!shouldPlay) {
    stopCrowdLoop();
    return;
  }
  const src = AUDIO_FILES.crowd;
  if (!src) return;
  if (!state.crowdLoop) {
    state.crowdLoop = new Audio(src);
    state.crowdLoop.preload = "auto";
    state.crowdLoop.loop = true;
    state.crowdLoop.volume = 0.35;
    state.crowdLoop.play().catch(() => {});
  }
}

function tryPlayAudioFile(kind) {
  const src = AUDIO_FILES[kind];
  if (!src || !state.musicEnabled) return false;
  if (!audioCache[kind]) {
    const base = new Audio(src);
    base.preload = "auto";
    audioCache[kind] = base;
  }
  try {
    const clip = audioCache[kind].cloneNode();
    clip.volume = kind === "hit" ? 0.55 : 0.65;
    clip.play().catch(() => {});
    return true;
  } catch (error) {
    return false;
  }
}

function playSfx(kind) {
  if ((kind === "rain" || kind === "lightning" || kind === "storm") && tryPlayAudioFile("rain")) return;
  if (tryPlayAudioFile(kind)) return;
  if (!state.musicEnabled || !state.audioCtx) return;
  const now = state.audioCtx.currentTime + 0.01;
  if (kind === "attack" || kind === "hit") {
    playNote(now, 190, 0.08, "sawtooth", 0.028);
  } else if (kind === "interact") {
    playNote(now, 320, 0.08, "triangle", 0.02);
    playNote(now + 0.07, 390, 0.1, "triangle", 0.018);
  } else if (kind === "skill") {
    playNote(now, 180, 0.08, "sine", 0.03);
    playNote(now + 0.08, 280, 0.12, "triangle", 0.024);
  } else if (kind === "mount") {
    playNote(now, 140, 0.09, "square", 0.025);
    playNote(now + 0.05, 220, 0.08, "triangle", 0.015);
  } else if (kind === "craft") {
    playNote(now, 280, 0.08, "square", 0.025);
    playNote(now + 0.1, 360, 0.08, "square", 0.02);
  } else if (kind === "hurt") {
    playNote(now, 120, 0.1, "sawtooth", 0.03);
  } else if (kind === "quest") {
    playNote(now, 330, 0.08, "triangle", 0.02);
    playNote(now + 0.08, 440, 0.12, "triangle", 0.02);
  } else if (kind === "rain") {
    playNote(now, 240, 0.14, "sine", 0.012);
  } else if (kind === "lightning") {
    playNote(now, 80, 0.18, "sawtooth", 0.04);
  } else if (kind === "storm") {
    playNote(now, 95, 0.12, "triangle", 0.03);
  } else if (kind.startsWith("vehicle-")) {
    playNote(now, 140, 0.09, "square", 0.025);
    playNote(now + 0.05, 220, 0.08, "triangle", 0.015);
  }
}

function initAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.musicEnabled) {
    stopMusic();
    stopVehicleLoop();
    stopCrowdLoop();
    state.musicEnabled = false;
    ui.audioBtn.textContent = "OST Off";
    ui.musicSetting.value = "off";
    return;
  }
  if (state.audioCtx.state === "suspended") state.audioCtx.resume();
  state.musicEnabled = true;
  ui.audioBtn.textContent = "OST On";
  ui.musicSetting.value = "on";
  playMusic();
  updateCrowdLoop();
  if (state.player?.mounted) startVehicleLoop(state.player.mounted.type);
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (state.appScreen !== "game" && event.code !== "Escape") return;
    state.keys.add(event.code);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    if (state.shop.active) {
      if (event.code === "KeyW" || event.code === "ArrowUp") moveShopSelection(-1);
      if (event.code === "KeyS" || event.code === "ArrowDown") moveShopSelection(1);
      if (event.code === "KeyF" || event.code === "Enter") buySelectedShopItem();
      if (event.code === "Escape" || event.code === "KeyQ") closeShop();
      return;
    }
    if (state.story.active) {
      if (["Space", "Enter", "KeyF"].includes(event.code)) advanceStory();
      return;
    }
    if (event.code === "KeyH" || event.code === "Space") attack();
    if (event.code === "KeyE") handleTalk();
    if (event.code === "KeyF") handleInteraction();
    if (event.code === "KeyQ") useSkill();
    if (event.code === "KeyR") craftReward();
    if (event.code === "KeyI") toggleInventory();
    if (/Digit[1-6]/.test(event.code)) {
      state.selectedSlot = Number(event.code.replace("Digit", "")) - 1;
      renderHotbar();
      renderInventory();
    }
    if (event.code === "Escape") {
      if (state.appScreen === "game") showScreen("menu");
      else if (state.appScreen === "menu" && state.launcher.hasSave) showScreen("game");
    }
  });
  window.addEventListener("keyup", (event) => state.keys.delete(event.code));
}

function bindMobile() {
  ui.mobileActions.forEach((button) => {
    const action = button.dataset.mobileAction;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (state.shop.active) {
        if (action === "interact" || action === "attack") moveShopSelection(-1);
        if (action === "mount" || action === "craft") moveShopSelection(1);
        if (action === "skill") closeShop();
        if (action === "inventory") buySelectedShopItem();
        return;
      }
      if (state.story.active) {
        if (action === "interact" || action === "attack" || action === "mount") advanceStory();
        return;
      }
      if (action === "attack") attack();
      if (action === "interact") handleTalk();
      if (action === "skill") useSkill();
      if (action === "mount") handleInteraction();
      if (action === "craft") craftReward();
      if (action === "inventory") toggleInventory();
    });
  });

  ui.joystickBase.addEventListener("pointerdown", (event) => {
    state.joystick.active = true;
    state.joystick.id = event.pointerId;
    ui.joystickBase.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  ui.joystickBase.addEventListener("pointermove", (event) => {
    if (!state.joystick.active || state.joystick.id !== event.pointerId) return;
    updateJoystick(event);
  });
  const release = (event) => {
    if (state.joystick.id !== null && event.pointerId !== state.joystick.id) return;
    state.joystick.active = false;
    state.joystick.id = null;
    state.mobileVector.x = 0;
    state.mobileVector.y = 0;
    ui.joystickKnob.style.transform = "translate(-50%, -50%)";
  };
  ui.joystickBase.addEventListener("pointerup", release);
  ui.joystickBase.addEventListener("pointercancel", release);
}

function updateJoystick(event) {
  const rect = ui.joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const limit = rect.width * 0.34;
  const n = normalize(dx, dy);
  const amount = Math.min(limit, n.len);
  state.mobileVector.x = n.x * (amount / limit);
  state.mobileVector.y = n.y * (amount / limit);
  ui.joystickKnob.style.transform = `translate(calc(-50% + ${n.x * amount}px), calc(-50% + ${n.y * amount}px))`;
}

function applyMobileControlsVisibility() {
  const controls = document.querySelector(".mobile-controls");
  const mode = state.mobileControls;
  const shouldHide = mode === "hide" || (mode === "auto" && window.innerWidth > 900);
  controls.classList.toggle("hidden", shouldHide);
}

function bindLauncher() {
  ui.openWorldBtn.addEventListener("click", () => showScreen("world"));
  ui.closeWorldBtn.addEventListener("click", () => showScreen("menu"));
  ui.openSettingsBtn.addEventListener("click", () => showScreen("settings"));
  ui.closeSettingsBtn.addEventListener("click", () => showScreen("menu"));
  ui.createWorldBtn.addEventListener("click", startWorld);
  ui.continueBtn.addEventListener("click", () => {
    const savedGame = readSavedGame();
    if (!savedGame) return;
    startWorld({ skipIntro: true, spawn: "coast", savedGame });
  });
  ui.musicSetting.addEventListener("change", () => {
    if (ui.musicSetting.value === "on" && !state.musicEnabled) initAudio();
    if (ui.musicSetting.value === "off" && state.musicEnabled) initAudio();
  });
  ui.mobileControlsSetting.addEventListener("change", () => {
    state.mobileControls = ui.mobileControlsSetting.value;
    applyMobileControlsVisibility();
  });
  ui.weatherSetting.addEventListener("change", () => {
    state.weatherLevel = ui.weatherSetting.value;
  });
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.now) / 1000);
  state.now = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function init() {
  resizeCanvasToViewport();
  render();
  const savedGame = readSavedGame();
  if (savedGame?.launcher) {
    state.launcher = { ...state.launcher, ...savedGame.launcher, hasSave: true };
    ui.worldNameInput.value = state.launcher.heroName || "Aru";
    ui.worldSizeSelect.value = state.launcher.worldSize || "normal";
    ui.difficultySelect.value = state.launcher.difficulty || "adventure";
    ui.worldThemeSelect.value = state.launcher.theme || "meadow";
  }
  ui.continueBtn.disabled = !savedGame;
  bindKeyboard();
  bindMobile();
  bindLauncher();
  ui.startBtn.addEventListener("click", () => {
    if (state.appScreen === "game") showScreen("menu");
    else if (state.launcher.hasSave && !state.running) {
      const savedGame = readSavedGame();
      if (savedGame) startWorld({ skipIntro: true, spawn: "coast", savedGame });
      else showScreen("menu");
    } else {
      showScreen(state.launcher.hasSave ? "game" : "menu");
    }
  });
  ui.audioBtn.addEventListener("click", initAudio);
  window.addEventListener("resize", () => {
    resizeCanvasToViewport();
    applyMobileControlsVisibility();
  });
  window.addEventListener("orientationchange", resizeCanvasToViewport);
  applyMobileControlsVisibility();
  addLog("Launcher siap. Setelah loading selesai, mulai perjalananmu.");
  const returnState = consumeReturnState();
  if (returnState?.spawn) {
    startWorld({ skipIntro: true, spawn: returnState.spawn, savedGame });
  } else {
    startBootSequence();
  }
  requestAnimationFrame(loop);
}

init();
