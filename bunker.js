const canvas = document.getElementById("bunkerCanvas");
const ctx = canvas.getContext("2d");
const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");
const actionButtons = document.querySelectorAll("[data-mobile-action]");
const RETURN_STATE_KEY = "corechiper-return-state";
const BUNKER_SAVE_KEY = "corechiper-bunker-save";

const AUDIO_FILES = {
  crowd: "assets/audio/crowd.mp3",
  rain: "assets/audio/rain.mp3",
  hit: "assets/audio/hit.mp3",
  "vehicle-car": "assets/audio/vehicle-car.mp3",
  "vehicle-jeep": "assets/audio/vehicle-jeep.mp3"
};

const images = {
  hero: new Image(),
  npc1: new Image(),
  npc2: new Image(),
  npc3: new Image(),
  npc4: new Image(),
  police1: new Image(),
  army: new Image(),
  jeep: new Image(),
  limo: new Image(),
  supercar: new Image()
};

images.hero.src = "assets/characters/karakter.png";
images.npc1.src = "assets/characters/npc1.png";
images.npc2.src = "assets/characters/npc2.png";
images.npc3.src = "assets/characters/npc3.png";
images.npc4.src = "assets/characters/npc4.png";
images.police1.src = "assets/characters/police1.png";
images.army.src = "assets/characters/army.png";
images.jeep.src = "assets/vehicles/jeep.png";
images.limo.src = "assets/vehicles/limo.png";
images.supercar.src = "assets/vehicles/supercar.png";

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

const state = {
  now: performance.now(),
  keys: new Set(),
  mobileVector: { x: 0, y: 0 },
  musicEnabled: true,
  audioCtx: null,
  crowdLoop: null,
  vehicleLoop: null,
  weather: { type: "clear", timer: 0, lightning: 2.8 },
  effects: [],
  player: {
    x: 220,
    y: 520,
    radius: 22,
    speed: 220,
    facing: 0,
    mounted: null
  },
  log: "Bunker Aegis aktif. E bicara, F interaksi.",
  npcs: [
    {
      name: "Nia",
      x: 330,
      y: 250,
      image: "npc1",
      color: "#ffd978",
      dialog: [
        "Anak-anak sudah tenang. Bunker ini jauh lebih aman dari permukaan.",
        "Kalau kota kacau, kita tetap jaga ritme di sini."
      ]
    },
    {
      name: "Rook",
      x: 450,
      y: 310,
      image: "npc2",
      color: "#8fd8ff",
      dialog: [
        "Dengar ventilasi itu? Bunker ini terdengar hidup walau malam panjang.",
        "Aku suka tempat ini. Tegang, tapi tetap keren."
      ]
    },
    {
      name: "Dokter Sena",
      x: 850,
      y: 250,
      image: "npc3",
      color: "#fff0b4",
      dialog: [
        "Stok medis aman. Kalau dunia di atas ribut, kita tetap jaga kepala dingin.",
        "Ruang rawat penuh, tapi semua masih terkendali."
      ]
    },
    {
      name: "Komandan Argo",
      x: 960,
      y: 500,
      image: "army",
      color: "#c1d7ff",
      dialog: [
        "Regu tentara berjaga di seluruh koridor. Tidak ada musuh yang masuk ke sini.",
        "Bunker ini basis terakhir, jadi semua sistem harus selalu siap."
      ]
    },
    {
      name: "Polisi Rena",
      x: 620,
      y: 560,
      image: "police1",
      color: "#9fd6ff",
      dialog: [
        "Warga datang bergelombang, tapi antreannya rapi. Kami jaga semuanya tetap tenang.",
        "Kalau mau ke City2, shuttle di hanggar timur sudah siap."
      ]
    }
  ],
  vehicles: [
    { type: "jeep", x: 1040, y: 548, width: 112, height: 62, image: "jeep", occupied: false, speedBoost: 1.25 },
    { type: "supercar", x: 860, y: 544, width: 108, height: 56, image: "supercar", occupied: false, speedBoost: 1.35 }
  ],
  zones: {
    command: { x: 760, y: 140, w: 210, h: 130, label: "Pusat Komando", prompt: "Monitor taktis menyala, kota dan City2 terlihat aman.", color: "#3d536f" },
    armory: { x: 1010, y: 170, w: 170, h: 130, label: "Gudang Senjata", prompt: "Rak senjata terkunci rapi. Semua perlengkapan standby.", color: "#875345" },
    shelter: { x: 230, y: 150, w: 320, h: 170, label: "Ruang Aman", prompt: "Kasur lipat, lampu hangat, dan suara keluarga membuat bunker terasa manusiawi.", color: "#48655b" },
    bus: { x: 1120, y: 540, w: 110, h: 88, label: "Shuttle City2", prompt: "Shuttle premium siap menuju City2.", color: "#d0aa55" }
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

function goToMainWorld(spawn = "bunker-terminal") {
  saveBunkerState();
  try {
    localStorage.setItem(RETURN_STATE_KEY, JSON.stringify({ spawn }));
  } catch (error) {
    // ignore storage issues
  }
  stopVehicleLoop();
  window.location.href = "index.html";
}

function readBunkerState() {
  try {
    const raw = localStorage.getItem(BUNKER_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveBunkerState() {
  try {
    localStorage.setItem(BUNKER_SAVE_KEY, JSON.stringify({
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

function restoreBunkerState() {
  const saved = readBunkerState();
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

function drawSprite(key, x, y, radius, fallback) {
  const img = images[key];
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

function drawVehicle(vehicle) {
  const img = images[vehicle.image];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
    return;
  }
  ctx.fillStyle = "#dbe8ff";
  ctx.fillRect(vehicle.x - vehicle.width / 2, vehicle.y - vehicle.height / 2, vehicle.width, vehicle.height);
}

function drawName(label, x, y, tone = "rgba(14,22,32,0.84)") {
  const width = Math.max(96, label.length * 9);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, width, 22, 11);
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
  if ((kind === "rain" || kind === "lightning" || kind === "storm") && tryPlayAudioFile("rain", { volume: 0.35 })) return;
  if (tryPlayAudioFile(kind, { volume: kind === "hit" ? 0.42 : 0.35 })) return;
  if (!state.musicEnabled) return;
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = state.audioCtx.currentTime + 0.01;
  const osc = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  osc.type = kind === "hit" ? "sawtooth" : "triangle";
  osc.frequency.value = kind === "hit" ? 180 : 280;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(state.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

function ensureCrowdLoop() {
  if (state.crowdLoop || !state.musicEnabled) return;
  state.crowdLoop = tryPlayAudioFile("crowd", { loop: true, volume: 0.18 });
}

function stopVehicleLoop() {
  if (!state.vehicleLoop) return;
  state.vehicleLoop.pause();
  state.vehicleLoop.currentTime = 0;
  state.vehicleLoop = null;
}

function startVehicleLoop(vehicleType) {
  stopVehicleLoop();
  const audioKind = vehicleType === "jeep" ? "vehicle-jeep" : "vehicle-car";
  state.vehicleLoop = tryPlayAudioFile(audioKind, { loop: true, volume: 0.45 });
}

function setWeatherType() {
  const roll = Math.random();
  state.weather.type = roll > 0.86 ? "storm" : roll > 0.62 ? "rain" : roll > 0.34 ? "overcast" : "clear";
  state.weather.timer = rand(8, 18);
  state.log = state.weather.type === "clear"
    ? "Filter udara stabil. Bunker terasa tenang."
    : state.weather.type === "overcast"
      ? "Cuaca di permukaan mendung. Lampu bunker terasa lebih hangat."
      : state.weather.type === "rain"
        ? "Hujan turun di atas bunker. Suaranya terdengar di langit-langit baja."
        : "Petir mengguncang permukaan, tapi bunker tetap kokoh.";
}

function getInputVector() {
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
    Math.abs(state.player.x - (zone.x + zone.w / 2)) < zone.w / 2 + 42
    && Math.abs(state.player.y - (zone.y + zone.h / 2)) < zone.h / 2 + 42
  );
}

function getNearbyVehicle() {
  return state.vehicles.find((vehicle) => dist(vehicle, state.player) < 84);
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
  state.player.x += 48;
  state.player.mounted = null;
  stopVehicleLoop();
  state.log = "Kamu turun dari kendaraan bunker.";
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
  state.log = `Kamu naik ${vehicle.type}.`;
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
    saveBunkerState();
    window.location.href = "city2.html";
  }
}

function updateWeather(dt) {
  state.weather.timer -= dt;
  state.weather.lightning -= dt;
  if (state.weather.timer <= 0) setWeatherType();
  if (state.weather.type === "storm" && state.weather.lightning <= 0) {
    state.weather.lightning = rand(2, 5);
    state.effects.push({ type: "lightning", life: 0.14 });
    playSfx("lightning");
  }
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
  updateEffects(dt);

  const input = getInputVector();
  const speed = state.player.mounted ? state.player.speed * state.player.mounted.speedBoost : state.player.speed;
  if (input.len > 0.08) {
    state.player.x += input.x * speed * dt;
    state.player.y += input.y * speed * dt;
    state.player.facing = Math.atan2(input.y, input.x);
    if (Math.random() > 0.88) {
      state.effects.push({
        type: "spark",
        x: state.player.x + rand(-8, 8),
        y: state.player.y + 18,
        life: 0.18
      });
    }
  }

  state.player.x = clamp(state.player.x, 50, 1228);
  state.player.y = clamp(state.player.y, 68, 650);

  if (state.player.mounted) {
    state.player.mounted.x += (state.player.x - state.player.mounted.x) * 0.45;
    state.player.mounted.y += (state.player.y + 6 - state.player.mounted.y) * 0.45;
  }
  if (Math.random() > 0.992) saveBunkerState();
}

function drawRainOverlay() {
  if (state.weather.type === "clear") return;
  if (state.weather.type === "overcast") {
    ctx.fillStyle = "rgba(70, 82, 104, 0.14)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  ctx.strokeStyle = state.weather.type === "storm" ? "rgba(220,235,255,0.52)" : "rgba(220,235,255,0.32)";
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 57 + performance.now() * 0.3) % canvas.width;
    const y = (i * 39 + performance.now() * 0.7) % canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y + 18);
    ctx.stroke();
  }
  state.effects.filter((effect) => effect.type === "lightning").forEach(() => {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#243345");
  bg.addColorStop(1, "#101720");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#22303b";
  ctx.fillRect(62, 78, 1154, 584);
  ctx.fillStyle = "#354859";
  ctx.fillRect(96, 110, 1086, 520);
  ctx.fillStyle = "#1a2531";
  ctx.fillRect(96, 420, 1086, 98);
  ctx.fillStyle = "#4d6277";
  for (let i = 0; i < 10; i += 1) {
    ctx.fillRect(130 + i * 108, 462, 64, 14);
  }

  ctx.fillStyle = "#2b3946";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(150 + i * 160, 132, 22, 276);
  }

  Object.values(state.zones).forEach((zone) => {
    ctx.fillStyle = zone.color;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    drawName(zone.label, zone.x + zone.w / 2, zone.y - 24);
  });

  ctx.fillStyle = "#62807a";
  ctx.fillRect(254, 188, 220, 104);
  ctx.fillStyle = "#788ea2";
  ctx.fillRect(790, 172, 148, 84);
  ctx.fillStyle = "#a14e41";
  ctx.fillRect(1040, 208, 110, 82);

  state.vehicles.forEach((vehicle) => {
    drawVehicle(vehicle);
    drawName(vehicle.type.toUpperCase(), vehicle.x, vehicle.y - 58, "rgba(18,24,32,0.88)");
  });

  state.npcs.forEach((npc) => {
    drawSprite(npc.image, npc.x, npc.y, 20, npc.color);
    drawName(npc.name, npc.x, npc.y - 42);
  });

  if (!state.player.mounted) {
    drawSprite("hero", state.player.x, state.player.y, state.player.radius, "#84d7ff");
  } else {
    drawSprite("hero", state.player.x, state.player.y - 12, 18, "#84d7ff");
  }

  state.effects.forEach((effect) => {
    if (effect.type === "spark") {
      ctx.fillStyle = "rgba(255, 230, 140, 0.55)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 4 + effect.life * 12, 0, Math.PI * 2);
      ctx.fill();
    }
  });

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

  ctx.fillStyle = "rgba(6,10,18,0.6)";
  ctx.beginPath();
  ctx.roundRect(12, 12, compact ? Math.min(canvas.width - 24, 292) : 400, compact ? 74 : 92, 24);
  ctx.fill();
  ctx.fillStyle = "#f6fbff";
  ctx.font = `700 ${compact ? 15 : 18}px 'Space Grotesk'`;
  ctx.fillText("Bunker Aegis", 26, compact ? 36 : 48);
  ctx.font = `${compact ? 12 : 14}px 'Space Grotesk'`;
  ctx.fillStyle = "#dbeaff";
  ctx.fillText(compact ? "Zona aman, hanggar, penjaga, dan warga." : "Area aman tanpa musuh, penuh penjaga, warga, dan hanggar evakuasi City2.", 26, compact ? 56 : 76);
  ctx.fillText(`Cuaca permukaan: ${state.weather.type.toUpperCase()}`, 26, compact ? 72 : 96);

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

  ctx.fillStyle = "rgba(6,10,18,0.48)";
  ctx.beginPath();
  ctx.roundRect(12, canvas.height - (compact ? 54 : 64), compact ? Math.min(canvas.width - 24, 360) : 760, compact ? 30 : 38, 18);
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
      goToMainWorld("bunker-terminal");
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
        goToMainWorld("bunker-terminal");
      }
      if (action === "bus") {
        stopVehicleLoop();
        window.location.href = "city2.html";
      }
      if (action === "alarm") state.log = "Sirene bunker dinyalakan. Semua jalur aman tetap hijau.";
      if (action === "stash") state.log = "Stash darurat dicek. Logistik bunker stabil.";
      if (action === "dash") state.log = "Koridor bunker cukup luas untuk latihan gerak cepat.";
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
restoreBunkerState();
bind();
requestAnimationFrame(loop);
