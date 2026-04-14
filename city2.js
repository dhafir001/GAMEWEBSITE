const canvas = document.getElementById("city2Canvas");
const ctx = canvas.getContext("2d");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const actionButtons = document.querySelectorAll("[data-mobile-action]");
const RETURN_STATE_KEY = "corechiper-return-state";
const CITY2_SAVE_KEY = "corechiper-city2-save";

const AUDIO_FILES = {
  crowd: "assets/audio/crowd.mp3",
  rain: "assets/audio/rain.mp3",
  "vehicle-car": "assets/audio/vehicle-car.mp3",
  "vehicle-jeep": "assets/audio/vehicle-jeep.mp3",
  "vehicle-hover": "assets/audio/vehicle-hover.mp3",
  hit: "assets/audio/hit.mp3"
};

const images = {
  hero: new Image(),
  npc1: new Image(),
  npc2: new Image(),
  npc3: new Image(),
  npc4: new Image(),
  npc5: new Image(),
  npc6: new Image(),
  npc7: new Image(),
  npc8: new Image(),
  police1: new Image(),
  army: new Image(),
  limo: new Image(),
  supercar: new Image(),
  luxurysuv: new Image(),
  jeep: new Image()
};

images.hero.src = "assets/characters/karakter.png";
images.npc1.src = "assets/characters/npc1.png";
images.npc2.src = "assets/characters/npc2.png";
images.npc3.src = "assets/characters/npc3.png";
images.npc4.src = "assets/characters/npc4.png";
images.npc5.src = "assets/characters/npc5.png";
images.npc6.src = "assets/characters/npc6.png";
images.npc7.src = "assets/characters/npc7.png";
images.npc8.src = "assets/characters/npc8.png";
images.police1.src = "assets/characters/police1.png";
images.army.src = "assets/characters/army.png";
images.limo.src = "assets/vehicles/limo.png";
images.supercar.src = "assets/vehicles/supercar.png";
images.luxurysuv.src = "assets/vehicles/luxurysuv.png";
images.jeep.src = "assets/vehicles/jeep.png";

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

const WORLD = { width: 3200, height: 1600 };
const ROAD_CENTER = 940;
const ROAD_HALF_WIDTH = 92;

const state = {
  now: performance.now(),
  keys: new Set(),
  mobileVector: { x: 0, y: 0 },
  weather: { type: "clear", timer: 0, lightning: 3.5 },
  musicEnabled: true,
  audioCtx: null,
  crowdLoop: null,
  vehicleLoop: null,
  effects: [],
  camera: { x: 0, y: 0 },
  log: "City2 aktif. E bicara, F untuk kendaraan dan bus.",
  player: {
    x: 240,
    y: 935,
    radius: 22,
    speed: 225,
    mounted: null
  },
  npcs: [
    { name: "Vara Luxe", x: 360, y: 320, image: "npc1", color: "#f7cf82", dialog: ["Selamat datang di City2. Di sini kemewahan dianggap kebutuhan dasar.", "Kota ini tenang karena semua orang kuat datang dengan aturan sendiri."] },
    { name: "Tuan Regar", x: 650, y: 300, image: "npc2", color: "#ffd5b1", dialog: ["Aku suka boulevard ini. Mobil mewah terlihat jauh lebih pantas di jalan selebar ini.", "Di City2, status sosial kadang terdengar lebih keras dari klakson."] },
    { name: "Lady Sorel", x: 980, y: 290, image: "npc3", color: "#ffd7ef", dialog: ["Skyline City2 paling cantik saat hujan tipis memantul di kaca menara.", "Malam di sini tenang, tapi tetap glamor."] },
    { name: "Nyonya Tavia", x: 1340, y: 280, image: "npc4", color: "#f4d7ff", dialog: ["Plaza Pengaruh hanya untuk mereka yang tahu cara berbicara dengan harga mahal.", "Aku lebih suka pesta kecil, mobil panjang, dan rahasia yang rapi."] },
    { name: "Arvin Gold", x: 1740, y: 340, image: "npc5", color: "#fff0b4", dialog: ["Pusat bisnis ada di menara utara. Tapi semua keputusan penting justru dibuat di lounge kecil.", "Jangan kaget kalau satu kendaraan di sini lebih mahal dari satu desa kecil."] },
    { name: "Mira Sterling", x: 850, y: 620, image: "npc6", color: "#ffe6b3", dialog: ["Supercar merah itu favoritku, tapi limo hitam lebih berwibawa.", "Kalau ingin terasa elite, pilih kendaraanmu dengan ego yang tepat."] },
    { name: "Direktur Oren", x: 2180, y: 360, image: "npc7", color: "#d8deff", dialog: ["Di distrik timur, semua rumah punya gerbang sendiri dan jalan privat.", "City2 sengaja dibuat luas supaya elite tidak saling menempel."] },
    { name: "Selene Vale", x: 2580, y: 470, image: "npc8", color: "#ffe0c8", dialog: ["Taman tinggi dan kanal marmer di ujung timur adalah spot terbaik untuk santai.", "Kalau mau keliling cepat, ambil limo hitam di boulevard utama."] },
    { name: "Polisi Damar", x: 2260, y: 930, image: "police1", color: "#b4daff", dialog: ["Kami jaga City2 tetap bersih, aman, dan tidak berisik.", "Bus kembali ke kota utama standby sepanjang hari."] },
    { name: "Mayor Karsa", x: 2720, y: 860, image: "army", color: "#d3e1ff", dialog: ["Tentara berjaga di distrik ini hanya untuk hal yang benar-benar penting.", "Tidak ada musuh di City2, hanya protokol dan ketertiban."] }
  ],
  vehicles: [
    { type: "limo", x: 420, y: 940, width: 160, height: 62, image: "limo", speedBoost: 1.4, occupied: false },
    { type: "supercar", x: 760, y: 940, width: 116, height: 54, image: "supercar", speedBoost: 1.55, occupied: false },
    { type: "luxurysuv", x: 1100, y: 940, width: 126, height: 60, image: "luxurysuv", speedBoost: 1.32, occupied: false },
    { type: "jeep", x: 1440, y: 940, width: 122, height: 60, image: "jeep", speedBoost: 1.24, occupied: false },
    { type: "limo", x: 2140, y: 940, width: 160, height: 62, image: "limo", speedBoost: 1.4, occupied: false },
    { type: "supercar", x: 2500, y: 940, width: 116, height: 54, image: "supercar", speedBoost: 1.55, occupied: false }
  ],
  npcCars: [
    { x: 180, y: 886, width: 112, height: 48, image: "supercar", dir: 1, speed: 84, lane: -1 },
    { x: 1160, y: 990, width: 146, height: 50, image: "limo", dir: -1, speed: 68, lane: 1 },
    { x: 1760, y: 886, width: 120, height: 50, image: "luxurysuv", dir: 1, speed: 76, lane: -1 },
    { x: 2840, y: 990, width: 118, height: 48, image: "supercar", dir: -1, speed: 88, lane: 1 }
  ],
  zones: {
    bus: { x: 2920, y: 915, w: 150, h: 92, label: "Bus Kembali", prompt: "Bus siap kembali ke kota utama.", color: "#d6b153" },
    plaza: { x: 520, y: 560, w: 420, h: 210, label: "Plaza Pengaruh", prompt: "Plaza penuh tokoh kaya, pembicaraan bisnis, dan aura mahal.", color: "#d4be83" },
    tower: { x: 1200, y: 150, w: 240, h: 330, label: "Menara Elite", prompt: "Menara elite memantulkan kilat dan cahaya kota dengan anggun.", color: "#dce6f5" },
    lounge: { x: 180, y: 220, w: 260, h: 156, label: "Lounge Sapphire", prompt: "Lounge privat menampung tamu paling berpengaruh di City2.", color: "#586d8f" },
    estate: { x: 2360, y: 220, w: 380, h: 200, label: "Estate Aurum", prompt: "Kawasan estate timur terasa seperti kota kecil khusus orang super kaya.", color: "#d8d0b8" },
    marina: { x: 2620, y: 560, w: 360, h: 160, label: "Marina Privasi", prompt: "Marina privat dipenuhi lampu lembut, mobil valet, dan jalur tamu VIP.", color: "#7ca3b8" }
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, len };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function goToMainWorld() {
  saveCity2State();
  try {
    localStorage.setItem(RETURN_STATE_KEY, JSON.stringify({ spawn: "bus-terminal" }));
  } catch (error) {
    // ignore storage issues
  }
  stopVehicleLoop();
  window.location.href = "index.html";
}

function readCity2State() {
  try {
    const raw = localStorage.getItem(CITY2_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveCity2State() {
  try {
    localStorage.setItem(CITY2_SAVE_KEY, JSON.stringify({
      player: {
        x: state.player.x,
        y: state.player.y
      },
      vehicle: state.player.mounted?.type || null,
      weather: state.weather,
      log: state.log
    }));
  } catch (error) {
    // ignore storage issues
  }
}

function restoreCity2State() {
  const saved = readCity2State();
  if (!saved) return;
  state.player.x = saved.player?.x ?? state.player.x;
  state.player.y = saved.player?.y ?? state.player.y;
  state.weather = { ...state.weather, ...saved.weather };
  state.log = saved.log || state.log;
  if (saved.vehicle) {
    const vehicle = state.vehicles.find((entry) => entry.type === saved.vehicle);
    if (vehicle) {
      vehicle.occupied = true;
      state.player.mounted = vehicle;
    }
  }
}

function roadCenterYAt(x) {
  return ROAD_CENTER
    + Math.sin(x * 0.0024) * 34
    + Math.sin(x * 0.0009 + 1.1) * 22;
}

function roadYAt(x, lane = 0) {
  return roadCenterYAt(x) + lane * 52;
}

function drawSprite(imgKey, x, y, radius, fallback) {
  const img = images[imgKey];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    return;
  }
  ctx.fillStyle = fallback;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawVehicle(vehicle, alpha = 1) {
  const img = images[vehicle.image];
  ctx.save();
  ctx.globalAlpha = alpha;
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
  } else {
    ctx.fillStyle = "#dbe8ff";
    ctx.fillRect(vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
  }
  ctx.restore();
}

function drawTag(label, x, y, tone = "rgba(12,20,34,0.82)") {
  const w = Math.max(94, label.length * 8.6);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#f4fbff";
  ctx.font = "12px 'Space Grotesk'";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 15);
  ctx.textAlign = "left";
}

function tryPlayAudioFile(kind, { loop = false, volume = 0.5 } = {}) {
  const src = AUDIO_FILES[kind];
  if (!src || !state.musicEnabled) return null;
  try {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = loop;
    audio.volume = volume;
    audio.play().catch(() => {});
    return audio;
  } catch (error) {
    return null;
  }
}

function playSfx(kind) {
  if ((kind === "rain" || kind === "lightning" || kind === "storm") && tryPlayAudioFile("rain", { volume: 0.34 })) return;
  if (tryPlayAudioFile(kind, { volume: kind === "hit" ? 0.4 : 0.34 })) return;
  if (!state.musicEnabled) return;
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = state.audioCtx.currentTime + 0.01;
  const osc = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  osc.type = kind === "hit" ? "square" : "triangle";
  osc.frequency.value = kind === "hit" ? 170 : 260;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.028, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(gain).connect(state.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function ensureCrowdLoop() {
  if (state.crowdLoop || !state.musicEnabled) return;
  state.crowdLoop = tryPlayAudioFile("crowd", { loop: true, volume: 0.2 });
}

function stopVehicleLoop() {
  if (!state.vehicleLoop) return;
  state.vehicleLoop.pause();
  state.vehicleLoop.currentTime = 0;
  state.vehicleLoop = null;
}

function startVehicleLoop(type) {
  stopVehicleLoop();
  const kind = type === "jeep" ? "vehicle-jeep" : type === "luxurysuv" ? "vehicle-hover" : "vehicle-car";
  state.vehicleLoop = tryPlayAudioFile(kind, { loop: true, volume: 0.46 });
}

function setWeatherType() {
  const roll = Math.random();
  state.weather.type = roll > 0.84 ? "storm" : roll > 0.58 ? "rain" : roll > 0.3 ? "overcast" : "clear";
  state.weather.timer = rand(10, 18);
  state.log = state.weather.type === "clear"
    ? "Langit City2 cerah dan boulevard kembali berkilau."
    : state.weather.type === "overcast"
      ? "Mendung tipis membuat menara City2 terlihat lebih dramatis."
      : state.weather.type === "rain"
        ? "Hujan halus memantul di boulevard City2."
        : "Petir menyala di balik skyline, tapi distrik elite tetap tenang.";
}

function getInput() {
  let x = 0;
  let y = 0;
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) y -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) y += 1;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) x -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) x += 1;
  x += state.mobileVector.x;
  y += state.mobileVector.y;
  return normalize(x, y);
}

function getNearbyNpc() {
  return state.npcs.find((npc) => dist(npc, state.player) < 88);
}

function getNearbyZone() {
  return Object.values(state.zones).find((zone) =>
    Math.abs(state.player.x - (zone.x + zone.w / 2)) < zone.w / 2 + 40
    && Math.abs(state.player.y - (zone.y + zone.h / 2)) < zone.h / 2 + 40
  );
}

function getNearbyVehicle() {
  return state.vehicles.find((vehicle) => dist(vehicle, state.player) < 86);
}

function talk() {
  const npc = getNearbyNpc();
  if (!npc) return;
  state.log = `${npc.name}: ${pick(npc.dialog)}`;
  playSfx("hit");
}

function dismountVehicle() {
  if (!state.player.mounted) return;
  state.player.mounted.occupied = false;
  state.player.x += 46;
  state.player.mounted = null;
  stopVehicleLoop();
  state.log = "Kamu turun dari kendaraan mewah.";
}

function mountVehicle(vehicle) {
  if (state.player.mounted === vehicle) {
    dismountVehicle();
    return;
  }
  if (state.player.mounted) {
    state.player.mounted.occupied = false;
  }
  vehicle.occupied = true;
  state.player.mounted = vehicle;
  state.log = `Kamu naik ${vehicle.type}. City2 langsung terasa lebih mewah.`;
  startVehicleLoop(vehicle.type);
}

function interact() {
  const vehicle = getNearbyVehicle();
  if (vehicle) {
    mountVehicle(vehicle);
    return;
  }
  const zone = getNearbyZone();
  if (!zone) return;
  state.log = zone.prompt;
  playSfx("hit");
  if (zone === state.zones.bus) {
    goToMainWorld();
  }
}

function updateWeather(dt) {
  state.weather.timer -= dt;
  state.weather.lightning -= dt;
  if (state.weather.timer <= 0) setWeatherType();
  if (state.weather.type === "storm" && state.weather.lightning <= 0) {
    state.weather.lightning = rand(2.2, 5);
    state.effects.push({ type: "lightning", life: 0.15 });
    playSfx("lightning");
  }
}

function updateTraffic(dt) {
  state.npcCars.forEach((car) => {
    car.x += car.dir * car.speed * dt;
    const min = 120;
    const max = WORLD.width - 120;
    if (car.x < min || car.x > max) {
      car.dir *= -1;
    }
    car.y = roadYAt(car.x, car.lane);
  });
}

function updateEffects(dt) {
  state.effects.forEach((effect) => {
    effect.life -= dt;
  });
  state.effects = state.effects.filter((effect) => effect.life > 0);
}

function update(dt) {
  ensureCrowdLoop();
  updateWeather(dt);
  updateTraffic(dt);
  updateEffects(dt);

  const input = getInput();
  const speed = state.player.mounted ? state.player.speed * state.player.mounted.speedBoost : state.player.speed;
  if (input.len > 0.08) {
    state.player.x += input.x * speed * dt;
    state.player.y += input.y * speed * dt;
    if (Math.random() > 0.9) {
      state.effects.push({ type: "spark", x: state.player.x, y: state.player.y + 18, life: 0.18 });
    }
  }

  state.player.x = clamp(state.player.x, 40, WORLD.width - 40);
  state.player.y = clamp(state.player.y, 48, WORLD.height - 60);

  if (state.player.mounted) {
    const roadCenter = roadCenterYAt(state.player.x);
    state.player.y = clamp(state.player.y, roadCenter - ROAD_HALF_WIDTH + 18, roadCenter + ROAD_HALF_WIDTH - 18);
    state.player.mounted.x += (state.player.x - state.player.mounted.x) * 0.45;
    state.player.mounted.y += (state.player.y + 7 - state.player.mounted.y) * 0.45;
  }
  if (Math.random() > 0.992) saveCity2State();

  state.camera.x = clamp(state.player.x - canvas.width / 2, 0, WORLD.width - canvas.width);
  state.camera.y = clamp(state.player.y - canvas.height / 2, 0, WORLD.height - canvas.height);
}

function drawRainOverlay() {
  if (state.weather.type === "clear") return;
  if (state.weather.type === "overcast") {
    ctx.fillStyle = "rgba(70, 88, 112, 0.16)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  ctx.strokeStyle = state.weather.type === "storm" ? "rgba(220,235,255,0.58)" : "rgba(220,235,255,0.3)";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 59 + performance.now() * 0.28) % canvas.width;
    const y = (i * 41 + performance.now() * 0.75) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 20);
    ctx.stroke();
  }
  if (state.effects.some((effect) => effect.type === "lightning")) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#cde7ff");
  sky.addColorStop(0.45, "#86b0da");
  sky.addColorStop(1, "#24364f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  ctx.fillStyle = "#9ad18b";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = "#86c0df";
  ctx.fillRect(0, 1120, WORLD.width, WORLD.height - 1120);

  ctx.fillStyle = "#b4c8df";
  const towers = [
    { x: 150, y: 190, w: 128, h: 270, c: "#dfe9f9" },
    { x: 350, y: 142, w: 160, h: 318, c: "#d1def0" },
    { x: 620, y: 166, w: 152, h: 294, c: "#dec9a6" },
    { x: 940, y: 110, w: 168, h: 350, c: "#dce6f7" },
    { x: 1260, y: 148, w: 182, h: 312, c: "#cad9ee" },
    { x: 1710, y: 170, w: 150, h: 290, c: "#e7eef9" },
    { x: 1960, y: 130, w: 210, h: 330, c: "#d5def1" },
    { x: 2320, y: 160, w: 180, h: 300, c: "#ece0c6" },
    { x: 2620, y: 120, w: 200, h: 340, c: "#d4e2f5" }
  ];

  towers.forEach((tower) => {
    ctx.fillStyle = tower.c;
    ctx.fillRect(tower.x, tower.y, tower.w, tower.h);
    ctx.fillStyle = "#35506c";
    for (let rx = 0; rx < 4; rx += 1) {
      for (let ry = 0; ry < 8; ry += 1) {
        ctx.fillRect(tower.x + 16 + rx * 28, tower.y + 18 + ry * 30, 13, 18);
      }
    }
  });

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#59718b";
  ctx.lineWidth = ROAD_HALF_WIDTH * 2;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.width; x += 40) {
    const y = roadCenterYAt(x);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#7f93a9";
  ctx.lineWidth = 52;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.width; x += 40) {
    const y = roadCenterYAt(x);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#f6de8e";
  ctx.lineWidth = 7;
  for (let x = 0; x <= WORLD.width; x += 92) {
    const x2 = Math.min(WORLD.width, x + 42);
    ctx.beginPath();
    ctx.moveTo(x, roadCenterYAt(x));
    ctx.lineTo(x2, roadCenterYAt(x2));
    ctx.stroke();
  }

  ctx.fillStyle = "#5f7d61";
  for (let i = 0; i < 22; i += 1) {
    const x = 80 + i * 150;
    ctx.beginPath();
    ctx.arc(x, 794 + Math.sin(i * 1.4) * 18, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 5, 794 + Math.sin(i * 1.4) * 18, 10, 38);
  }

  ctx.fillStyle = "#c7d6b2";
  ctx.fillRect(2280, 520, 640, 170);
  ctx.fillStyle = "#f3f1df";
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(2340 + i * 150, 280, 110, 84);
    ctx.fillRect(2330 + i * 150, 364, 130, 90);
  }

  Object.values(state.zones).forEach((zone) => {
    ctx.fillStyle = zone.color;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    drawTag(zone.label, zone.x + zone.w / 2, zone.y - 24);
  });

  state.npcCars.forEach((car) => {
    drawVehicle(car, 0.86);
  });
  state.vehicles.forEach((vehicle) => {
    drawVehicle(vehicle);
    drawTag(vehicle.type.toUpperCase(), vehicle.x, vehicle.y - 58, "rgba(16,24,36,0.86)");
  });

  state.npcs.forEach((npc) => {
    drawSprite(npc.image, npc.x, npc.y, 20, npc.color);
    drawTag(npc.name, npc.x, npc.y - 42);
  });

  if (!state.player.mounted) {
    drawSprite("hero", state.player.x, state.player.y, state.player.radius, "#84d7ff");
  } else {
    drawSprite("hero", state.player.x, state.player.y - 12, 18, "#84d7ff");
  }

  state.effects.forEach((effect) => {
    if (effect.type === "spark") {
      ctx.fillStyle = "rgba(255, 244, 180, 0.55)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 4 + effect.life * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  const promptNpc = getNearbyNpc();
  const promptVehicle = getNearbyVehicle();
  const promptZone = getNearbyZone();
  const compact = isCompactViewport();
  const prompt = promptVehicle
    ? `F naik ${promptVehicle.type}`
    : promptZone
      ? `F gunakan ${promptZone.label}`
      : promptNpc
        ? `E bicara dengan ${promptNpc.name}`
        : state.player.mounted
          ? "F turun dari kendaraan"
          : "";

  ctx.fillStyle = "rgba(7,14,24,0.58)";
  ctx.beginPath();
  ctx.roundRect(12, 12, compact ? Math.min(canvas.width - 24, 326) : 474, compact ? 74 : 92, 24);
  ctx.fill();
  ctx.fillStyle = "#f6fbff";
  ctx.font = `700 ${compact ? 15 : 18}px 'Space Grotesk'`;
  ctx.fillText("City2", 26, compact ? 36 : 48);
  ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
  ctx.fillStyle = "#dcecff";
  ctx.fillText(compact ? "Distrik elite, polisi, tentara, dan kendaraan premium." : "Distrik elite tanpa musuh, penuh orang kaya, polisi, tentara, dan kendaraan premium.", 26, compact ? 56 : 76);
  ctx.fillText(`Cuaca: ${state.weather.type.toUpperCase()}`, 26, compact ? 72 : 96);

  if (prompt) {
    ctx.fillStyle = "rgba(255,241,170,0.15)";
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - (compact ? 132 : 182), canvas.height - (compact ? 76 : 88), compact ? 264 : 364, compact ? 32 : 38, 18);
    ctx.fill();
    ctx.fillStyle = "#fff3b5";
    ctx.textAlign = "center";
    ctx.fillText(prompt, canvas.width / 2, canvas.height - (compact ? 54 : 63));
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "rgba(6,10,18,0.46)";
  ctx.beginPath();
  ctx.roundRect(12, canvas.height - (compact ? 54 : 64), compact ? Math.min(canvas.width - 24, 420) : 780, compact ? 30 : 38, 18);
  ctx.fill();
  ctx.fillStyle = "#edf7ff";
  ctx.fillText(state.log, 24, canvas.height - (compact ? 34 : 39));

  drawRainOverlay();
}

function updateJoystick(event) {
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const limit = rect.width * 0.34;
  const n = normalize(dx, dy);
  const amount = Math.min(limit, n.len);
  state.mobileVector.x = n.x * (amount / limit);
  state.mobileVector.y = n.y * (amount / limit);
  joystickKnob.style.transform = `translate(calc(-50% + ${n.x * amount}px), calc(-50% + ${n.y * amount}px))`;
}

function bind() {
  resizeCanvasToViewport();
  window.addEventListener("keydown", (event) => {
    state.keys.add(event.code);
    if (event.code === "KeyE") talk();
    if (event.code === "KeyF") interact();
    if (event.code === "Escape") {
      goToMainWorld();
    }
  });
  window.addEventListener("keyup", (event) => state.keys.delete(event.code));

  let pointerId = null;
  const release = (event) => {
    if (pointerId !== null && event && pointerId !== event.pointerId) return;
    pointerId = null;
    state.mobileVector.x = 0;
    state.mobileVector.y = 0;
    joystickKnob.style.transform = "translate(-50%, -50%)";
  };

  joystickBase.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    joystickBase.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystickBase.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    updateJoystick(event);
  });
  joystickBase.addEventListener("pointerup", release);
  joystickBase.addEventListener("pointercancel", release);

  actionButtons.forEach((button) => {
    button.addEventListener("pointerdown", () => {
      const action = button.dataset.mobileAction;
      if (action === "interact") talk();
      if (action === "back") {
        goToMainWorld();
      }
      if (action === "bus") {
        goToMainWorld();
      }
      if (action === "plaza") state.log = "Plaza penuh pembicaraan rahasia, gaya mahal, dan lampu lembut.";
      if (action === "tower") state.log = "Menara elite memayungi distrik dengan kaca tinggi dan keamanan ketat.";
      if (action === "dash") state.log = "Boulevard City2 sangat luas, halus, dan enak untuk berkendara.";
    });
  });
  window.addEventListener("resize", resizeCanvasToViewport);
  window.addEventListener("orientationchange", resizeCanvasToViewport);
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.now) / 1000);
  state.now = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

resizeCanvasToViewport();
setWeatherType();
restoreCity2State();
bind();
requestAnimationFrame(loop);
