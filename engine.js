// ============================================================
// TECH TREE — Grand Strategy Prototype
// Isometric circumpolar world with nested cycles
// Water, Axis Mundi, Bears, Two Paths
// ============================================================

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const epochEl = document.getElementById('epoch');
const panelLeft = document.getElementById('panel-left');
const panelRight = document.getElementById('panel-right');
const pauseOverlay = document.getElementById('pause-overlay');

// --- High-DPI ---
let dpr = 1;
function resize() {
  dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const W = () => window.innerWidth;
const H = () => window.innerHeight;

// ============================================================
// ISOMETRIC HELPERS
// ============================================================

const ISO = {
  tileW: 48,
  tileH: 24,
  toScreen(wx, wy, camera) {
    const cx = (wx - wy) * (this.tileW / 2);
    const cy = (wx + wy) * (this.tileH / 2);
    return {
      x: cx - camera.x + W() / 2,
      y: cy - camera.y + H() / 2
    };
  },
  toWorld(sx, sy, camera) {
    const rx = sx + camera.x - W() / 2;
    const ry = sy + camera.y - H() / 2;
    const wx = (rx / (this.tileW / 2) + ry / (this.tileH / 2)) / 2;
    const wy = (ry / (this.tileH / 2) - rx / (this.tileW / 2)) / 2;
    return { x: Math.round(wx), y: Math.round(wy) };
  }
};

// ============================================================
// WORLD STATE
// ============================================================

const MAP_SIZE = 64;

const TERRAIN = {
  DEEP_ICE: 0,
  TUNDRA: 1,
  BOREAL: 2,
  COAST: 3,
  OCEAN: 4,
  CAVE: 5,
  MOUNTAIN: 6,
  BERINGIA: 7,
  RIVER: 8,
  AXIS_MUNDI: 9,  // The pole — the world tree location
};

const TERRAIN_COLORS = {
  [TERRAIN.DEEP_ICE]: { base: [220, 230, 245], snow: true },
  [TERRAIN.TUNDRA]: { base: [170, 180, 165], snow: true },
  [TERRAIN.BOREAL]: { base: [75, 105, 75], snow: true, trees: true },
  [TERRAIN.COAST]: { base: [120, 140, 130], snow: true },
  [TERRAIN.OCEAN]: { base: [40, 55, 85], snow: false, water: true },
  [TERRAIN.CAVE]: { base: [110, 95, 80], snow: true, cave: true },
  [TERRAIN.MOUNTAIN]: { base: [150, 145, 155], snow: true, mountain: true },
  [TERRAIN.BERINGIA]: { base: [55, 70, 95], snow: false },
  [TERRAIN.RIVER]: { base: [55, 80, 120], snow: false, water: true },
  [TERRAIN.AXIS_MUNDI]: { base: [240, 235, 250], snow: true, axisMundi: true },
};

const state = {
  tick: 0,
  paused: false,
  speed: 1,
  yearsBP: 52000,
  season: 0.35,
  year: 0,
  generation: 0,
  dayPhase: 0.5,

  // Nested cycles
  equinoxDrift: 0,
  generationKnowledge: 1.0,
  glacialPhase: 0.3,
  glacialDirection: 1,
  beringiaOpen: false,

  // Camera
  camera: { x: 0, y: 0 },
  targetCamera: { x: 0, y: 0 },

  // Map
  tiles: [],

  // POIs
  caves: [],
  axisMundi: { wx: 32, wy: 32, accessible: true }, // center of map = pole

  // Bears — roaming entities
  bears: [],

  // Reindeer herds
  reindeer: [],

  // Band
  band: {
    wx: 32, wy: 20,
    targetWx: 32, targetWy: 20,
    moving: false,
    people: 12,
    elders: 3,
    songs: 5,
    fire: true,
    bearSkulls: 0,
    food: 80,         // food stores
    path: 'none',     // 'none' | 'reindeer' | 'ash'
  },

  knowledge: {
    stone: 1,
    cord: 0,
    fire: 1,
    pigment: 0,
    bear: 0,
    stars: 0,
    song: 1,
    reindeer: 0,      // path of the reindeer
    agriculture: 0,   // path of the ash
    axisMundi: 0,     // deep sky knowledge from the pole
  },

  ashQuality: 0,
  burnedTiles: 0,     // tracks slash-and-burn usage
  tendedSeasons: 0,   // tracks axis-righting consistency

  // Weather
  snowflakes: [],
  wind: { x: 0.3, y: 0.1 },

  // Stars
  stars: [],

  // Aurora
  auroraFlash: 0,

  // Messages
  messages: [],
};

// ============================================================
// WORLD GENERATION
// ============================================================

function generateTerrain() {
  state.tiles = [];
  const center = MAP_SIZE / 2;

  for (let y = 0; y < MAP_SIZE; y++) {
    state.tiles[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const noise = simplex(x * 0.1, y * 0.1) * 5;
      const noise2 = simplex(x * 0.15 + 50, y * 0.15 + 50) * 3;

      let terrain;
      if (dist < 2) {
        terrain = TERRAIN.AXIS_MUNDI;  // The pole
      } else if (dist < 8 + noise) {
        terrain = TERRAIN.DEEP_ICE;
      } else if (dist < 14 + noise) {
        terrain = TERRAIN.TUNDRA;
      } else if (dist < 22 + noise * 1.5) {
        terrain = TERRAIN.BOREAL;
      } else if (dist < 26 + noise) {
        terrain = TERRAIN.COAST;
      } else {
        terrain = TERRAIN.OCEAN;
      }

      // Beringia corridor
      const beringiaAngle = Math.PI / 2;
      const angleDiff = Math.abs(angleDelta(angle, beringiaAngle));
      if (angleDiff < 0.2 && dist > 24 && dist < 30) {
        terrain = TERRAIN.BERINGIA;
      }

      // Rivers — radial from ice to coast
      const riverAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 0.75, Math.PI * 1.25];
      for (const ra of riverAngles) {
        const ad = Math.abs(angleDelta(angle, ra));
        const riverWidth = 0.04 + simplex(dist * 0.3 + ra * 10, ra * 5) * 0.02;
        if (ad < riverWidth && dist > 10 + noise2 && dist < 25 + noise && terrain !== TERRAIN.OCEAN) {
          terrain = TERRAIN.RIVER;
        }
      }

      // Mountains
      if ((terrain === TERRAIN.BOREAL || terrain === TERRAIN.TUNDRA) &&
        simplex(x * 0.3 + 100, y * 0.3 + 100) > 0.6) {
        terrain = TERRAIN.MOUNTAIN;
      }

      state.tiles[y][x] = {
        terrain,
        elevation: dist,
        angle,
        treeHeight: terrain === TERRAIN.BOREAL ? 0.4 + Math.random() * 0.6 : 0,
        snowDepth: 0,
        burned: false,       // slash-and-burn state
        burnedTimer: 0,
        fertility: terrain === TERRAIN.BOREAL ? 0.5 : terrain === TERRAIN.TUNDRA ? 0.2 : 0,
        growing: false,      // has crops from ash agriculture
      };
    }
  }

  // Place caves around the ring
  state.caves = [];
  const caveNames = [
    'Kivistö', 'Talvola', 'Pohjanne', 'Tulikko', 'Karhula',
    'Jokinen', 'Vuorela', 'Otsola', 'Ilmanen', 'Maanala',
    'Tähtiä', 'Revontuli'
  ];
  const knowledgeGifts = [null, 'cord', null, 'pigment', 'bear', null, 'stars', null, 'reindeer', 'bear', 'agriculture', 'pigment'];

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 16 + simplex(i * 7, i * 3) * 3;
    const cx = Math.round(center + Math.cos(a) * r);
    const cy = Math.round(center + Math.sin(a) * r);

    if (cx >= 0 && cx < MAP_SIZE && cy >= 0 && cy < MAP_SIZE) {
      state.tiles[cy][cx].terrain = TERRAIN.CAVE;
      state.caves.push({
        wx: cx, wy: cy,
        name: caveNames[i] || 'Cave',
        knowledge: knowledgeGifts[i],
        hasBear: Math.random() > 0.6,
        visited: false,
      });
    }
  }

  // Position band near first cave
  if (state.caves.length > 0) {
    state.band.wx = state.caves[0].wx;
    state.band.wy = state.caves[0].wy;
    state.band.targetWx = state.band.wx;
    state.band.targetWy = state.band.wy;
  }
}

function generateBears() {
  state.bears = [];
  const center = MAP_SIZE / 2;
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 10;
    state.bears.push({
      wx: center + Math.cos(a) * r,
      wy: center + Math.sin(a) * r,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      alive: true,
      hibernating: false,
    });
  }
}

function generateReindeer() {
  state.reindeer = [];
  const center = MAP_SIZE / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    const r = 11 + Math.random() * 4;
    const herd = [];
    for (let j = 0; j < 6 + Math.floor(Math.random() * 6); j++) {
      herd.push({
        ox: (Math.random() - 0.5) * 3,
        oy: (Math.random() - 0.5) * 3,
      });
    }
    state.reindeer.push({
      wx: center + Math.cos(a) * r,
      wy: center + Math.sin(a) * r,
      migrationAngle: a,
      herd,
      season: state.season,
    });
  }
}

function generateStars() {
  state.stars = [];
  for (let i = 0; i < 150; i++) {
    state.stars.push({
      x: Math.random() * 2 - 1,
      y: Math.random() * 0.5 - 0.1,
      brightness: Math.random() * 0.7 + 0.3,
      size: Math.random() > 0.93 ? 2 : 1,
      isBear: false,
    });
  }
  // Ursa Major — the Bear
  const ursaPoints = [
    { x: -0.05, y: 0.05 }, { x: -0.02, y: 0.03 },
    { x: 0.01, y: 0.04 }, { x: 0.04, y: 0.06 },
    { x: 0.06, y: 0.04 }, { x: 0.05, y: 0.01 },
    { x: 0.03, y: -0.01 },
  ];
  ursaPoints.forEach(p => {
    state.stars.push({ x: p.x, y: p.y, brightness: 1.0, size: 2.5, isBear: true });
  });
}

function generateSnowflakes() {
  state.snowflakes = [];
  for (let i = 0; i < 300; i++) {
    state.snowflakes.push({
      x: Math.random() * W(), y: Math.random() * H(),
      speed: 0.3 + Math.random() * 0.8,
      size: 1 + Math.random() * 2,
      wobble: Math.random() * Math.PI * 2,
      opacity: 0.2 + Math.random() * 0.5,
    });
  }
}

// ============================================================
// NOISE & UTILITY
// ============================================================

function simplex(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  const m = Math.sin(x * 269.5 + y * 183.3) * 28001.8384;
  return (Math.sin(n + m) + 1) / 2 - 0.5;
}

function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function lerpColor(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function distWrap(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function addMessage(text) {
  state.messages.push({ text, tick: state.tick, alpha: 1.0 });
  if (state.messages.length > 5) state.messages.shift();
}

// ============================================================
// INPUT
// ============================================================

const keys = {};
const mouse = { x: 0, y: 0 };

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    state.paused = !state.paused;
    pauseOverlay.style.display = state.paused ? 'block' : 'none';
    e.preventDefault();
  }
  if (e.code === 'KeyT') tendKnowledge();
  if (e.code === 'KeyR') rightTheAxis();
  if (e.code === 'KeyE') interactAtLocation();
  if (e.code === 'KeyB') slashAndBurn();
  if (e.code === 'KeyF') followReindeer();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

canvas.addEventListener('click', e => {
  const world = ISO.toWorld(e.clientX, e.clientY, state.camera);
  if (world.x >= 0 && world.x < MAP_SIZE && world.y >= 0 && world.y < MAP_SIZE) {
    const tile = state.tiles[world.y]?.[world.x];
    if (tile && tile.terrain !== TERRAIN.OCEAN && tile.terrain !== TERRAIN.DEEP_ICE) {
      state.band.targetWx = world.x;
      state.band.targetWy = world.y;
      state.band.moving = true;
    }
  }
});

// ============================================================
// GAME ACTIONS
// ============================================================

function tendKnowledge() {
  if (state.band.elders > 0 && state.band.songs > 0) {
    state.generationKnowledge = Math.min(1.0, state.generationKnowledge + 0.05);
    addMessage('Songs tended. Knowledge preserved.');
  }
}

function rightTheAxis() {
  const nearEquinox = Math.abs(state.season - 0.25) < 0.05 ||
    Math.abs(state.season - 0.75) < 0.05;
  if (!nearEquinox) {
    addMessage('The axis can only be righted at equinox.');
    return;
  }
  if (state.knowledge.stars < 1) {
    addMessage('You need star knowledge to right the axis.');
    return;
  }
  const correction = Math.min(state.equinoxDrift, 0.3);
  state.equinoxDrift -= correction;
  state.ashQuality += correction * 0.1;
  state.tendedSeasons++;
  state.auroraFlash = 1.0;
  addMessage('◈ The axis is righted. The sky answers.');
}

function interactAtLocation() {
  const bx = Math.round(state.band.wx);
  const by = Math.round(state.band.wy);
  const tile = state.tiles[by]?.[bx];

  // Cave interaction
  const cave = state.caves.find(c => c.wx === bx && c.wy === by);
  if (cave) {
    if (cave.knowledge && state.knowledge[cave.knowledge] === 0) {
      state.knowledge[cave.knowledge] = 1;
      addMessage(`Learned: ${cave.knowledge}`);
      cave.knowledge = null;
      // Check if this sets a path
      if (state.knowledge.reindeer === 1 && state.band.path === 'none') {
        state.band.path = 'reindeer';
        addMessage('Path chosen: The Reindeer. You follow the herd.');
      }
      if (state.knowledge.agriculture === 1 && state.band.path === 'none') {
        state.band.path = 'ash';
        addMessage('Path chosen: The Ash. You tend the burned earth.');
      }
    }
    if (cave.hasBear && state.knowledge.bear > 0) {
      state.band.bearSkulls++;
      cave.hasBear = false;
      state.ashQuality += 0.05;
      addMessage('Bear ceremony performed. Skull placed on the tree.');
    }
    cave.visited = true;
    return;
  }

  // Axis Mundi interaction
  if (tile && tile.terrain === TERRAIN.AXIS_MUNDI) {
    if (state.glacialPhase > 0.7) {
      addMessage('The ice is too thick. The axis mundi is buried.');
      return;
    }
    state.knowledge.axisMundi = Math.min(3, state.knowledge.axisMundi + 1);
    state.auroraFlash = 1.5;
    const level = state.knowledge.axisMundi;
    if (level === 1) addMessage('The pole. The sky turns around this point. You begin to understand.');
    else if (level === 2) addMessage('The precession reveals itself. The great mill turns.');
    else addMessage('The long count. 26,000 years. You see it now.');
    return;
  }

  // Bear encounter
  const nearBear = state.bears.find(b => b.alive && !b.hibernating && distWrap(b.wx, b.wy, bx, by) < 2);
  if (nearBear) {
    if (state.knowledge.bear > 0) {
      // Ceremony
      nearBear.alive = false;
      state.band.bearSkulls++;
      state.band.food += 40;
      state.ashQuality += 0.05;
      addMessage('The bear is honored. Meat for the band. Skull for the tree.');
    } else {
      // Hunt without ceremony
      nearBear.alive = false;
      state.band.food += 30;
      addMessage('Bear hunted. Meat gained, but no ceremony performed.');
    }
    return;
  }
}

function slashAndBurn() {
  if (state.knowledge.agriculture < 1) {
    addMessage('You do not yet know the way of ash.');
    return;
  }
  const bx = Math.round(state.band.wx);
  const by = Math.round(state.band.wy);
  const tile = state.tiles[by]?.[bx];
  if (!tile || tile.terrain !== TERRAIN.BOREAL || tile.burned) {
    addMessage('Nothing here to burn.');
    return;
  }

  // Slash and burn — clear the tree, enrich the soil
  tile.burned = true;
  tile.burnedTimer = 0;
  tile.treeHeight = 0;
  tile.fertility += 0.4;
  tile.growing = true;
  state.burnedTiles++;
  state.band.food += 25;

  // Leave the birch?
  if (state.knowledge.song > 0 && state.generationKnowledge > 0.5) {
    addMessage('The tree falls. The ash feeds the earth. The birch is left standing.');
    state.ashQuality += 0.03;
  } else {
    addMessage('The tree falls. The ash feeds the earth.');
    state.ashQuality -= 0.02;
  }
}

function followReindeer() {
  if (state.knowledge.reindeer < 1) {
    addMessage('You do not yet know the way of the reindeer.');
    return;
  }
  // Find nearest herd
  const nearest = state.reindeer.reduce((best, herd) => {
    const d = distWrap(herd.wx, herd.wy, state.band.wx, state.band.wy);
    return d < best.d ? { herd, d } : best;
  }, { herd: null, d: Infinity });

  if (nearest.d < 8) {
    state.band.targetWx = Math.round(nearest.herd.wx);
    state.band.targetWy = Math.round(nearest.herd.wy);
    state.band.moving = true;
    state.band.food += 10;
    addMessage('Following the herd. The reindeer know the way.');
  } else {
    addMessage('No herd nearby to follow.');
  }
}

// ============================================================
// GAME UPDATE
// ============================================================

function update() {
  if (state.paused) return;
  state.tick++;

  // --- Camera ---
  const scrollSpeed = 4;
  let manualScroll = false;
  if (keys['KeyW'] || keys['ArrowUp']) { state.targetCamera.y -= scrollSpeed; manualScroll = true; }
  if (keys['KeyS'] || keys['ArrowDown']) { state.targetCamera.y += scrollSpeed; manualScroll = true; }
  if (keys['KeyA'] || keys['ArrowLeft']) { state.targetCamera.x -= scrollSpeed; manualScroll = true; }
  if (keys['KeyD'] || keys['ArrowRight']) { state.targetCamera.x += scrollSpeed; manualScroll = true; }

  if (!manualScroll) {
    const bandScreen = ISO.toScreen(state.band.wx, state.band.wy, state.camera);
    const dx = bandScreen.x - W() / 2;
    const dy = bandScreen.y - H() / 2;
    const deadzone = 80;
    if (Math.abs(dx) > deadzone) state.targetCamera.x += (dx - Math.sign(dx) * deadzone) * 0.02;
    if (Math.abs(dy) > deadzone) state.targetCamera.y += (dy - Math.sign(dy) * deadzone) * 0.02;
  }

  state.camera.x += (state.targetCamera.x - state.camera.x) * 0.08;
  state.camera.y += (state.targetCamera.y - state.camera.y) * 0.08;

  // --- Time ---
  const timeSpeed = 0.0008 * state.speed;
  state.season = (state.season + timeSpeed) % 1.0;
  state.dayPhase = (state.dayPhase + timeSpeed * 4) % 1.0;

  if (state.season < timeSpeed && state.tick > 10) {
    state.year++;
    state.yearsBP--;
    state.band.food -= 3; // yearly food consumption

    if (state.year % 30 === 0) {
      state.generation++;
      state.generationKnowledge *= 0.85;
      if (state.band.elders > 0 && Math.random() > 0.5) {
        state.band.elders--;
        state.band.songs = Math.max(0, state.band.songs - 1);
      }
      if (state.band.people > 5 && Math.random() > 0.6) {
        state.band.elders = Math.min(state.band.elders + 1, state.band.people);
      }
      // New people
      if (state.band.food > 50) {
        state.band.people = Math.min(30, state.band.people + Math.floor(Math.random() * 3));
      }
    }
  }

  // --- Glacial cycle ---
  state.glacialPhase += 0.000008 * state.glacialDirection;
  if (state.glacialPhase >= 1.0) { state.glacialPhase = 1.0; state.glacialDirection = -1; }
  if (state.glacialPhase <= 0) { state.glacialPhase = 0; state.glacialDirection = 1; }
  state.beringiaOpen = state.glacialPhase > 0.6;

  // Axis mundi accessibility
  state.axisMundi.accessible = state.glacialPhase < 0.7;

  // --- Equinox drift ---
  state.equinoxDrift += 0.00005;
  if (state.equinoxDrift > 0.5) state.generationKnowledge *= 0.9995;

  // --- Snow depth ---
  const winterIntensity = Math.max(0, Math.cos(state.season * Math.PI * 2));
  for (let i = 0; i < 200; i++) {
    const rx = Math.floor(Math.random() * MAP_SIZE);
    const ry = Math.floor(Math.random() * MAP_SIZE);
    const tile = state.tiles[ry][rx];
    if (TERRAIN_COLORS[tile.terrain]?.snow) {
      tile.snowDepth += (winterIntensity * 0.8 - tile.snowDepth) * 0.1;
    }
    // Burned tiles regrow over time
    if (tile.burned) {
      tile.burnedTimer++;
      if (tile.burnedTimer > 500) {
        tile.burned = false;
        tile.treeHeight = 0.1;
        tile.growing = false;
      }
    }
  }

  // --- Band movement ---
  if (state.band.moving) {
    const dx = state.band.targetWx - state.band.wx;
    const dy = state.band.targetWy - state.band.wy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.15) {
      state.band.wx = state.band.targetWx;
      state.band.wy = state.band.targetWy;
      state.band.moving = false;
    } else {
      const moveSpeed = 0.05;
      state.band.wx += (dx / dist) * moveSpeed;
      state.band.wy += (dy / dist) * moveSpeed;
    }
  }

  // --- Bears ---
  state.bears.forEach(bear => {
    if (!bear.alive) return;

    // Hibernate in deep winter
    bear.hibernating = state.season > 0.85 || state.season < 0.15;
    if (bear.hibernating) return;

    // Wander
    bear.wanderTimer++;
    if (bear.wanderTimer > 60 + Math.random() * 120) {
      bear.wanderAngle += (Math.random() - 0.5) * 1.5;
      bear.wanderTimer = 0;
    }
    const speed = 0.015;
    const nx = bear.wx + Math.cos(bear.wanderAngle) * speed;
    const ny = bear.wy + Math.sin(bear.wanderAngle) * speed;
    // Stay in tundra/boreal
    const tile = state.tiles[Math.round(ny)]?.[Math.round(nx)];
    if (tile && (tile.terrain === TERRAIN.TUNDRA || tile.terrain === TERRAIN.BOREAL ||
      tile.terrain === TERRAIN.CAVE || tile.terrain === TERRAIN.COAST)) {
      bear.wx = nx;
      bear.wy = ny;
    } else {
      bear.wanderAngle += Math.PI * 0.5;
    }
  });

  // --- Reindeer migration ---
  state.reindeer.forEach(herd => {
    // Migrate: in summer move toward pole (tundra), in winter move toward coast (boreal)
    const center = MAP_SIZE / 2;
    const targetDist = state.season > 0.2 && state.season < 0.7 ? 11 : 18;
    const currentAngle = Math.atan2(herd.wy - center, herd.wx - center);
    const currentDist = distWrap(herd.wx, herd.wy, center, center);

    // Move along ring and radially
    const radialPull = (targetDist - currentDist) * 0.002;
    const tangentialDrift = 0.003;

    herd.wx += Math.cos(currentAngle) * radialPull + Math.cos(currentAngle + Math.PI / 2) * tangentialDrift;
    herd.wy += Math.sin(currentAngle) * radialPull + Math.sin(currentAngle + Math.PI / 2) * tangentialDrift;

    // Clamp to map
    herd.wx = Math.max(5, Math.min(MAP_SIZE - 5, herd.wx));
    herd.wy = Math.max(5, Math.min(MAP_SIZE - 5, herd.wy));
  });

  // --- Wind ---
  state.wind.x = Math.sin(state.tick * 0.003) * 0.5;
  state.wind.y = Math.cos(state.tick * 0.002) * 0.2 + 0.1;

  // --- Snowflakes ---
  state.snowflakes.forEach(flake => {
    flake.y += flake.speed * (0.5 + winterIntensity);
    flake.x += state.wind.x * flake.speed + Math.sin(flake.wobble + state.tick * 0.01) * 0.3;
    flake.wobble += 0.02;
    if (flake.y > H()) { flake.y = -5; flake.x = Math.random() * W(); }
    if (flake.x > W()) flake.x = 0;
    if (flake.x < 0) flake.x = W();
  });

  // --- Aurora flash decay ---
  if (state.auroraFlash > 0) state.auroraFlash *= 0.97;

  // --- Messages decay ---
  state.messages.forEach(m => {
    m.alpha = Math.max(0, 1.0 - (state.tick - m.tick) / 300);
  });
  state.messages = state.messages.filter(m => m.alpha > 0.01);

  // --- Food warning ---
  if (state.band.food <= 0 && state.tick % 120 === 0) {
    state.band.people = Math.max(1, state.band.people - 1);
    addMessage('Hunger claims a soul.');
  }

  updateHUD();
}

function updateHUD() {
  epochEl.textContent = `${Math.floor(state.yearsBP).toLocaleString()} years before present`;

  const knowledgeList = Object.entries(state.knowledge)
    .filter(([k, v]) => v > 0)
    .map(([k, v]) => v > 1 ? `${k} (${v})` : k);

  const cave = state.caves.find(c => c.wx === Math.round(state.band.wx) && c.wy === Math.round(state.band.wy));
  const bx = Math.round(state.band.wx);
  const by = Math.round(state.band.wy);
  const tile = state.tiles[by]?.[bx];
  const atAxisMundi = tile && tile.terrain === TERRAIN.AXIS_MUNDI;
  const nearBear = state.bears.find(b => b.alive && !b.hibernating && distWrap(b.wx, b.wy, bx, by) < 2);
  const nearHerd = state.reindeer.find(h => distWrap(h.wx, h.wy, bx, by) < 5);

  const pathLabel = state.band.path === 'none' ? 'undecided' :
    state.band.path === 'reindeer' ? '🦌 reindeer' : '🔥 ash';

  panelLeft.innerHTML = [
    `band: ${state.band.people} souls · path: ${pathLabel}`,
    `elders: ${state.band.elders} · songs: ${state.band.songs}`,
    `food: ${Math.floor(state.band.food)} · bear skulls: ${state.band.bearSkulls}`,
    `<br>knowledge: ${knowledgeList.join(', ')}`,
    cave ? `<br><span style="color:#ddc87a">⌂ ${cave.name}</span>` : '',
    cave?.knowledge ? `<span style="color:#adc8aa">[e] learn ${cave.knowledge}</span>` : '',
    cave?.hasBear && state.knowledge.bear ? `<span style="color:#d8b88a">[e] bear ceremony</span>` : '',
    atAxisMundi ? `<br><span style="color:#e0d0ff">✦ Axis Mundi${state.axisMundi.accessible ? ' — [e] commune' : ' — buried in ice'}</span>` : '',
    nearBear ? `<br><span style="color:#c8a878">🐻 Bear nearby — [e] ${state.knowledge.bear ? 'ceremony hunt' : 'hunt'}</span>` : '',
    nearHerd && state.knowledge.reindeer ? `<br><span style="color:#a8c8a8">🦌 Herd nearby — [f] follow</span>` : '',
    tile && tile.terrain === TERRAIN.BOREAL && !tile.burned && state.knowledge.agriculture ? `<span style="color:#d8a868">[b] slash and burn</span>` : '',
  ].join('<br>');

  const seasonName = getSeason();
  const axisStatus = state.equinoxDrift < 0.1 ? 'aligned' :
    state.equinoxDrift < 0.3 ? 'drifting' : 'unmoored';

  panelRight.innerHTML = [
    seasonName,
    `axis: ${axisStatus}`,
    `ice age: ${(state.glacialPhase * 100).toFixed(0)}%`,
    `beringia: ${state.beringiaOpen ? '◆ OPEN' : '◇ submerged'}`,
    `axis mundi: ${state.axisMundi.accessible ? '✦ reachable' : '✧ ice-covered'}`,
    `generation: ${state.generation}`,
    `knowledge: ${(state.generationKnowledge * 100).toFixed(0)}%`,
    `ash quality: ${(state.ashQuality * 100).toFixed(0)}`,
  ].join('<br>');
}

function getSeason() {
  const s = state.season;
  if (s < 0.125) return '❄ deep winter';
  if (s < 0.2) return '❄ late winter';
  if (Math.abs(s - 0.25) < 0.03) return '◈ SPRING EQUINOX ◈ [r]';
  if (s < 0.375) return '✿ early summer';
  if (s < 0.5) return '☀ high summer';
  if (s < 0.625) return '☀ late summer';
  if (Math.abs(s - 0.75) < 0.03) return '◈ AUTUMN EQUINOX ◈ [r]';
  if (s < 0.875) return '🍂 late autumn';
  return '❄ early winter';
}

// ============================================================
// RENDERING
// ============================================================

function render() {
  const w = W();
  const h = H();
  const daylight = getDaylight();

  // --- Sky ---
  const skyTop = lerpColor([12, 16, 30], [90, 130, 180], daylight * 0.6);
  const skyBottom = lerpColor([18, 20, 32], [110, 130, 155], daylight * 0.5);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `rgb(${skyTop.join(',')})`);
  grad.addColorStop(1, `rgb(${skyBottom.join(',')})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // --- Stars ---
  const nightAmount = 1.0 - daylight;
  if (nightAmount > 0.2) renderStars(nightAmount);

  // --- Aurora ---
  if (nightAmount > 0.3) renderAurora(nightAmount);

  // --- Terrain ---
  renderTerrain();

  // --- Bears ---
  renderBears();

  // --- Reindeer ---
  renderReindeer();

  // --- Band ---
  renderBand();

  // --- Snow ---
  renderSnow(daylight);

  // --- Messages ---
  renderMessages();
}

function getDaylight() {
  const seasonalDay = Math.sin(state.season * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  const dailyCycle = Math.sin(state.dayPhase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  return Math.max(0.15, Math.min(1, seasonalDay * 0.65 + dailyCycle * 0.25 + 0.1));
}

function renderStars(nightAmount) {
  const w = W();
  const rotation = state.tick * 0.0002;
  state.stars.forEach(star => {
    const sx = (star.x * Math.cos(rotation) - star.y * Math.sin(rotation) + 1) * 0.5 * w;
    const sy = star.y * Math.cos(rotation) + star.x * Math.sin(rotation);
    const screenY = (sy + 0.3) * H() * 0.4;
    if (screenY < H() * 0.5) {
      if (star.isBear) {
        const pulse = Math.sin(state.tick * 0.015) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(255, 215, 140, ${star.brightness * nightAmount * pulse * 0.8})`;
        ctx.beginPath(); ctx.arc(sx, screenY, star.size * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 200, 100, ${0.08 * nightAmount * pulse})`;
        ctx.beginPath(); ctx.arc(sx, screenY, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(200, 210, 240, ${star.brightness * nightAmount * 0.5})`;
        ctx.beginPath(); ctx.arc(sx, screenY, star.size, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
}

function renderAurora(nightAmount) {
  const w = W();
  const intensity = nightAmount * (0.25 + (state.auroraFlash || 0) * 0.75);
  if (intensity < 0.05) return;
  for (let band = 0; band < 4; band++) {
    ctx.beginPath();
    const baseY = H() * 0.15 + band * 25;
    for (let x = 0; x < w; x += 4) {
      const wave = Math.sin(x * 0.008 + state.tick * 0.003 + band * 1.5) * 15 +
        Math.sin(x * 0.015 + state.tick * 0.005) * 8;
      const y = baseY + wave;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    const g = 180 + band * 20;
    ctx.strokeStyle = `rgba(80, ${g}, 140, ${intensity * 0.08 * (1 - band * 0.2)})`;
    ctx.lineWidth = 12 - band * 2;
    ctx.stroke();
  }
}

function renderTerrain() {
  const cam = state.camera;
  const daylight = getDaylight();
  const centerWorld = ISO.toWorld(W() / 2, H() / 2, cam);
  const margin = 5;
  const startX = Math.max(0, centerWorld.x - 22 - margin);
  const endX = Math.min(MAP_SIZE - 1, centerWorld.x + 22 + margin);
  const startY = Math.max(0, centerWorld.y - 22 - margin);
  const endY = Math.min(MAP_SIZE - 1, centerWorld.y + 22 + margin);

  for (let wy = startY; wy <= endY; wy++) {
    for (let wx = startX; wx <= endX; wx++) {
      const tile = state.tiles[wy]?.[wx];
      if (!tile) continue;
      const screen = ISO.toScreen(wx, wy, cam);
      if (screen.x < -60 || screen.x > W() + 60 || screen.y < -60 || screen.y > H() + 60) continue;

      const terrainInfo = TERRAIN_COLORS[tile.terrain];
      if (!terrainInfo) continue;

      let color = [...terrainInfo.base];
      const lit = 0.45 + daylight * 0.55;

      // Snow overlay
      if (terrainInfo.snow && tile.snowDepth > 0.1) {
        color = lerpColor(color, [220, 225, 240], tile.snowDepth * 0.6);
      }

      // Water animation
      if (terrainInfo.water) {
        const wave = Math.sin(state.tick * 0.02 + wx * 0.5 + wy * 0.3) * 0.1;
        const shimmer = Math.sin(state.tick * 0.03 + wx * 0.8 - wy * 0.4) * 8;
        color = color.map((c, i) => Math.floor(c + shimmer * (i === 2 ? 1 : 0.3)));
      }

      // Beringia
      if (tile.terrain === TERRAIN.BERINGIA) {
        if (state.beringiaOpen) {
          color = lerpColor([100, 110, 95], [200, 210, 225], tile.snowDepth * 0.4);
        } else {
          // Animated water
          const wave = Math.sin(state.tick * 0.02 + wx * 0.5 + wy * 0.3) * 8;
          color = [35 + wave, 50 + wave, 75 + wave];
        }
      }

      // Burned tiles — dark earth with green shoots
      if (tile.burned) {
        const regrowth = tile.burnedTimer / 500;
        color = lerpColor([40, 30, 25], [90, 120, 60], regrowth);
      }

      // Growing crops (from slash-and-burn)
      if (tile.growing && !tile.burned) {
        color = lerpColor(color, [120, 140, 60], 0.3);
      }

      color = color.map(c => Math.floor(Math.max(0, Math.min(255, c)) * lit));
      drawIsoDiamond(screen.x, screen.y, color);

      // Trees
      if (terrainInfo.trees && tile.treeHeight > 0.2 && !tile.burned) {
        drawTree(screen.x, screen.y, tile.treeHeight, tile.snowDepth, lit);
      }

      // Burned stump
      if (tile.burned && tile.burnedTimer < 200) {
        drawStump(screen.x, screen.y, lit);
      }

      // Mountain
      if (terrainInfo.mountain) {
        drawMountain(screen.x, screen.y, lit, tile.snowDepth);
      }

      // Cave
      if (terrainInfo.cave) {
        drawCave(screen.x, screen.y, lit);
      }

      // Axis Mundi
      if (terrainInfo.axisMundi) {
        drawAxisMundi(screen.x, screen.y, lit);
      }

      // River sparkle
      if (tile.terrain === TERRAIN.RIVER) {
        const sparkle = Math.sin(state.tick * 0.05 + wx * 2 + wy * 3);
        if (sparkle > 0.7) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(sparkle - 0.7) * daylight * 0.5})`;
          ctx.beginPath();
          ctx.arc(screen.x + (sparkle * 3), screen.y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawIsoDiamond(sx, sy, color) {
  const tw = ISO.tileW / 2;
  const th = ISO.tileH / 2;
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.beginPath();
  ctx.moveTo(sx, sy - th);
  ctx.lineTo(sx + tw, sy);
  ctx.lineTo(sx, sy + th);
  ctx.lineTo(sx - tw, sy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(0,0,0,0.08)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawTree(sx, sy, height, snow, lit) {
  const h = height * 18;
  const trunkBrown = Math.floor(40 * lit + 20);
  ctx.fillStyle = `rgb(${trunkBrown}, ${Math.floor(trunkBrown * 0.7)}, ${Math.floor(trunkBrown * 0.4)})`;
  ctx.fillRect(sx - 1, sy - h * 0.3, 2, h * 0.3);

  for (let i = 0; i < 3; i++) {
    const layerY = sy - h * 0.3 - i * (h * 0.25);
    const layerW = 5 - i * 1.2;
    const layerH = h * 0.3;
    const treeGreen = Math.floor(45 * lit + 15);
    ctx.fillStyle = `rgb(${Math.floor(25 * lit)}, ${treeGreen - i * 5}, ${Math.floor(20 * lit)})`;
    ctx.beginPath();
    ctx.moveTo(sx, layerY - layerH);
    ctx.lineTo(sx - layerW, layerY);
    ctx.lineTo(sx + layerW, layerY);
    ctx.closePath();
    ctx.fill();
    if (snow > 0.3) {
      ctx.fillStyle = `rgba(220, 225, 240, ${snow * 0.5 * lit})`;
      ctx.beginPath();
      ctx.moveTo(sx, layerY - layerH);
      ctx.lineTo(sx - layerW * 0.6, layerY - layerH * 0.5);
      ctx.lineTo(sx + layerW * 0.6, layerY - layerH * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawStump(sx, sy, lit) {
  const brown = Math.floor(35 * lit + 15);
  ctx.fillStyle = `rgb(${brown}, ${Math.floor(brown * 0.7)}, ${Math.floor(brown * 0.4)})`;
  ctx.fillRect(sx - 2, sy - 3, 4, 3);

  // Smoke wisps
  const smokeAlpha = Math.max(0, 0.3 - state.tick * 0.0001);
  if (smokeAlpha > 0) {
    for (let i = 0; i < 3; i++) {
      const smokeY = sy - 5 - Math.sin(state.tick * 0.01 + i) * 4 - i * 3;
      const smokeX = sx + Math.sin(state.tick * 0.008 + i * 2) * 3;
      ctx.fillStyle = `rgba(160, 150, 140, ${smokeAlpha * (0.5 - i * 0.15)})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 2 - i * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMountain(sx, sy, lit, snow) {
  const h = 20 + Math.sin(sx * 0.1) * 5;
  const gray = Math.floor(90 * lit);
  ctx.fillStyle = `rgb(${gray}, ${Math.floor(gray * 0.95)}, ${Math.floor(gray * 1.05)})`;
  ctx.beginPath();
  ctx.moveTo(sx, sy - h); ctx.lineTo(sx - 12, sy); ctx.lineTo(sx + 12, sy);
  ctx.closePath(); ctx.fill();
  if (snow > 0.1) {
    ctx.fillStyle = `rgba(230, 235, 245, ${(0.4 + snow * 0.4) * lit})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy - h); ctx.lineTo(sx - 4.8, sy - h * 0.5); ctx.lineTo(sx + 4.8, sy - h * 0.5);
    ctx.closePath(); ctx.fill();
  }
}

function drawCave(sx, sy, lit) {
  ctx.fillStyle = `rgba(20, 18, 15, ${0.6 + lit * 0.2})`;
  ctx.beginPath(); ctx.arc(sx, sy - 3, 5, Math.PI, 0); ctx.closePath(); ctx.fill();
  const glow = ctx.createRadialGradient(sx, sy - 2, 0, sx, sy - 2, 12);
  glow.addColorStop(0, `rgba(255, 150, 60, ${0.2 * lit})`);
  glow.addColorStop(1, 'rgba(255, 100, 30, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(sx, sy - 2, 12, 0, Math.PI * 2); ctx.fill();
  const g = Math.floor(70 * lit);
  ctx.fillStyle = `rgb(${g}, ${g - 5}, ${g - 10})`;
  ctx.beginPath();
  ctx.moveTo(sx - 8, sy - 2); ctx.lineTo(sx, sy - 10); ctx.lineTo(sx + 8, sy - 2);
  ctx.closePath(); ctx.fill();
}

function drawAxisMundi(sx, sy, lit) {
  // Glowing pillar of light at the pole
  const pulse = Math.sin(state.tick * 0.01) * 0.2 + 0.8;
  const accessible = state.axisMundi.accessible;
  const alpha = accessible ? 0.4 * pulse * lit : 0.1 * lit;

  // Vertical beam
  const beamGrad = ctx.createLinearGradient(sx, sy - 60, sx, sy);
  beamGrad.addColorStop(0, `rgba(200, 180, 255, 0)`);
  beamGrad.addColorStop(0.3, `rgba(200, 180, 255, ${alpha * 0.5})`);
  beamGrad.addColorStop(1, `rgba(200, 180, 255, ${alpha})`);
  ctx.fillStyle = beamGrad;
  ctx.fillRect(sx - 3, sy - 60, 6, 60);

  // Base glow
  const baseGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 20);
  baseGlow.addColorStop(0, `rgba(200, 180, 255, ${alpha})`);
  baseGlow.addColorStop(1, 'rgba(200, 180, 255, 0)');
  ctx.fillStyle = baseGlow;
  ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2); ctx.fill();

  // If ice-covered, overlay ice crystals
  if (!accessible) {
    ctx.fillStyle = `rgba(200, 220, 255, ${0.3 * lit})`;
    for (let i = 0; i < 5; i++) {
      const ix = sx + Math.sin(i * 1.3) * 8;
      const iy = sy - 5 + Math.cos(i * 1.7) * 5;
      ctx.beginPath(); ctx.arc(ix, iy, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Star above
  const starPulse = Math.sin(state.tick * 0.02) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 255, 240, ${starPulse * lit * (accessible ? 0.8 : 0.3)})`;
  ctx.beginPath(); ctx.arc(sx, sy - 55, 3, 0, Math.PI * 2); ctx.fill();
}

function renderBears() {
  state.bears.forEach(bear => {
    if (!bear.alive) return;
    const screen = ISO.toScreen(bear.wx, bear.wy, state.camera);
    if (screen.x < -30 || screen.x > W() + 30 || screen.y < -30 || screen.y > H() + 30) return;

    const daylight = getDaylight();
    const lit = 0.45 + daylight * 0.55;

    if (bear.hibernating) {
      // Sleeping — small indicator
      ctx.fillStyle = `rgba(120, 90, 60, ${0.3 * lit})`;
      ctx.beginPath(); ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2); ctx.fill();
      // Zzz
      ctx.fillStyle = `rgba(200, 200, 220, ${0.3 * lit})`;
      ctx.font = '8px Georgia';
      ctx.fillText('z', screen.x + 4, screen.y - 4);
      return;
    }

    // Bear body — chunky brown circle
    ctx.fillStyle = `rgba(100, 70, 45, ${0.9 * lit})`;
    ctx.beginPath(); ctx.arc(screen.x, screen.y - 2, 5, 0, Math.PI * 2); ctx.fill();

    // Head
    ctx.fillStyle = `rgba(90, 60, 35, ${0.9 * lit})`;
    ctx.beginPath(); ctx.arc(screen.x + 3, screen.y - 5, 3, 0, Math.PI * 2); ctx.fill();

    // Eyes
    ctx.fillStyle = `rgba(20, 20, 20, ${lit})`;
    ctx.beginPath(); ctx.arc(screen.x + 4, screen.y - 6, 0.8, 0, Math.PI * 2); ctx.fill();
  });
}

function renderReindeer() {
  state.reindeer.forEach(herdData => {
    const baseScreen = ISO.toScreen(herdData.wx, herdData.wy, state.camera);
    if (baseScreen.x < -60 || baseScreen.x > W() + 60 || baseScreen.y < -60 || baseScreen.y > H() + 60) return;

    const daylight = getDaylight();
    const lit = 0.45 + daylight * 0.55;

    herdData.herd.forEach((deer, i) => {
      const dx = deer.ox + Math.sin(state.tick * 0.005 + i) * 0.5;
      const dy = deer.oy + Math.cos(state.tick * 0.004 + i * 1.3) * 0.3;
      const deerScreen = ISO.toScreen(herdData.wx + dx, herdData.wy + dy, state.camera);

      // Body
      ctx.fillStyle = `rgba(140, 120, 90, ${0.8 * lit})`;
      ctx.beginPath();
      ctx.ellipse(deerScreen.x, deerScreen.y - 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Antlers (simple)
      ctx.strokeStyle = `rgba(100, 80, 50, ${0.6 * lit})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(deerScreen.x, deerScreen.y - 4);
      ctx.lineTo(deerScreen.x - 2, deerScreen.y - 7);
      ctx.moveTo(deerScreen.x, deerScreen.y - 4);
      ctx.lineTo(deerScreen.x + 2, deerScreen.y - 7);
      ctx.stroke();
    });
  });
}

function renderBand() {
  const screen = ISO.toScreen(state.band.wx, state.band.wy, state.camera);
  const daylight = getDaylight();
  const lit = 0.5 + daylight * 0.5;

  // Fire glow
  if (state.band.fire) {
    const flicker = Math.sin(state.tick * 0.12) * 0.15 + 0.85;
    const glow = ctx.createRadialGradient(screen.x, screen.y - 5, 0, screen.x, screen.y - 5, 30);
    glow.addColorStop(0, `rgba(255, 140, 40, ${0.25 * flicker})`);
    glow.addColorStop(0.5, `rgba(255, 80, 20, ${0.08 * flicker})`);
    glow.addColorStop(1, 'rgba(255, 60, 10, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(screen.x, screen.y - 5, 30, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < 3; i++) {
      const fh = 4 + Math.sin(state.tick * 0.15 + i * 2) * 2;
      const fx = screen.x - 2 + i * 2;
      ctx.fillStyle = `rgba(255, ${160 + i * 30}, ${40 + i * 20}, ${0.7 * lit})`;
      ctx.beginPath();
      ctx.moveTo(fx, screen.y - 4);
      ctx.lineTo(fx - 1.5, screen.y - 4 + fh * 0.3);
      ctx.lineTo(fx, screen.y - 4 - fh);
      ctx.lineTo(fx + 1.5, screen.y - 4 + fh * 0.3);
      ctx.closePath(); ctx.fill();
    }
  }

  // People
  const total = Math.min(state.band.people, 15);
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2 + state.tick * 0.001;
    const r = 5 + (i % 3) * 3;
    const px = screen.x + Math.cos(angle) * r;
    const py = screen.y - 6 + Math.sin(angle) * r * 0.5;
    const isElder = i < state.band.elders;
    ctx.fillStyle = isElder
      ? `rgba(255, 240, 200, ${0.9 * lit})`
      : `rgba(190, 170, 150, ${0.7 * lit})`;
    ctx.beginPath(); ctx.arc(px, py, isElder ? 2.5 : 1.8, 0, Math.PI * 2); ctx.fill();
  }

  // Movement path
  if (state.band.moving) {
    const targetScreen = ISO.toScreen(state.band.targetWx, state.band.targetWy, state.camera);
    const pulse = Math.sin(state.tick * 0.05) * 0.3 + 0.5;
    ctx.strokeStyle = `rgba(255, 220, 150, ${pulse * 0.3})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y);
    ctx.lineTo(targetScreen.x, targetScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255, 220, 150, ${pulse * 0.5})`;
    ctx.beginPath(); ctx.arc(targetScreen.x, targetScreen.y, 4, 0, Math.PI * 2); ctx.stroke();
  }
}

function renderSnow(daylight) {
  const winterIntensity = Math.max(0, Math.cos(state.season * Math.PI * 2));
  if (winterIntensity < 0.1) return;
  const alpha = winterIntensity * (0.2 + daylight * 0.4);
  state.snowflakes.forEach(flake => {
    ctx.fillStyle = `rgba(220, 225, 240, ${flake.opacity * alpha})`;
    ctx.beginPath(); ctx.arc(flake.x, flake.y, flake.size * 0.7, 0, Math.PI * 2); ctx.fill();
  });
}

function renderMessages() {
  const x = W() / 2;
  let y = H() - 60;
  ctx.textAlign = 'center';
  state.messages.forEach(msg => {
    ctx.fillStyle = `rgba(220, 210, 180, ${msg.alpha})`;
    ctx.font = '13px Georgia';
    ctx.fillText(msg.text, x, y);
    y -= 20;
  });
  ctx.textAlign = 'left';
}

// ============================================================
// MAIN LOOP
// ============================================================

generateTerrain();
generateBears();
generateReindeer();
generateStars();
generateSnowflakes();

// Center camera on band
const bandIsoX = (state.band.wx - state.band.wy) * (ISO.tileW / 2);
const bandIsoY = (state.band.wx + state.band.wy) * (ISO.tileH / 2);
state.camera.x = bandIsoX;
state.camera.y = bandIsoY;
state.targetCamera.x = state.camera.x;
state.targetCamera.y = state.camera.y;

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}
loop();
