let assets = {};
let sounds = {};
let scenario = 1; 

let trees = [];
let stumps = [];
let houses = [];
let mudChunks = []; 
let cracks = [];    
let rocks = [];     

let simTimer = 0;
let isSimRunning = false;
let showEndMessage = false;
let currentPower = 0; 

let screenShake = 0;
let flash = 0;
let lightningTimer = 0;
let lightningPos = {x: 400, y: 150};
let isAudioEnabled = false;

function preload() {
  assets.cloud = loadImage('cloud.png');
  assets.house = loadImage('house.png');
  assets.house1 = loadImage('house1.png');
  assets.lightning = loadImage('lightning.png');
  assets.tree = loadImage('tree.png');
  assets.tree1 = loadImage('tree1.png');   
  assets.stump = loadImage('tree.2.png');  
  assets.mud = loadImage('mud.png'); 

  soundFormats('mp3');
  sounds.rain = loadSound('rain.mp3');
  sounds.thunder = loadSound('thunder.mp3');
  sounds.rumble = loadSound('rumble.mp3');
}

function setup() {
  let cnv = createCanvas(800, 500);
  cnv.style('display', 'block');
  cnv.style('margin', '20px auto');
  cnv.style('border', '4px solid #333');
  imageMode(CENTER);

  let btn1 = createButton('🌳 1. Гора (Здрава почва)');
  btn1.position(20, 530);
  styleButton(btn1, '#2E7D32'); 
  btn1.mousePressed(() => { startVideo(1); });
  
  let btn2 = createButton('🪨 2. Сеч (Свлачище)');
  btn2.position(280, 530);
  styleButton(btn2, '#A1887F'); 
  btn2.mousePressed(() => { startVideo(2); });

  let btn3 = createButton('🌋 3. Земетресение');
  btn3.position(520, 530);
  styleButton(btn3, '#E64A19'); 
  btn3.mousePressed(() => { startVideo(3); });

  initObjects();
}

function initObjects() {
  randomSeed(12345); 
  trees = []; stumps = []; houses = []; cracks = []; rocks = []; mudChunks = [];
  
  for (let i = 0; i < 16; i++) {
    let tx = (i < 8) ? random(50, 200) : random(350, 480);
    let ridgeY = map(tx, 0, 450, 150, 440);
    let ty = random(ridgeY + 30, 460); 
    let tSize = random(60, 95);
    trees.push({ x: tx, y: ty, size: tSize, broken: false });
    stumps.push({ x: tx, y: ty + 15, size: tSize * 0.7 });
  }
  trees.sort((a, b) => a.y - b.y);
  stumps.sort((a, b) => a.y - b.y);

  houses.push({ x: 550, y: 440, ruined: false, scale: 0.7 }); 
  houses.push({ x: 690, y: 430, ruined: false, scale: 1.0 });

  let cx = 380, cy = 430; 
  for(let i=0; i<12; i++) { 
    let nx = cx + random(20, 40); 
    let ny = cy + random(5, 20); 
    cracks.push({x1: cx, y1: cy, x2: nx, y2: ny});
    cx = nx; cy = ny;
  }
}

function draw() {
  if (!isAudioEnabled) {
    background(30);
    fill(255); textAlign(CENTER); textSize(35); textFont('Arial'); textStyle(BOLD);
    text("🎬 НАТИСНИ ТУК ЗА ДА ОТКЛЮЧИШ ЗВУКА", width/2, height/2);
    return;
  }

  // --- УМНА ЛОГИКА НА ВРЕМЕТО ---
  // Ако е земетресение, времето е 1800 кадъра (30 сек). Иначе е 3600 (60 сек).
  let maxTime = (scenario === 3) ? 1800 : 3600;
  let fadeIn = (scenario === 3) ? 300 : 900;
  let fadeOut = (scenario === 3) ? 1500 : 2700;

  if (isSimRunning) {
    simTimer++;
    
    // ПЛАВНО засилване, задържане и ПЛАВНО затихване
    if (simTimer <= fadeIn) {
      currentPower = map(simTimer, 0, fadeIn, 0, 100);
    } else if (simTimer <= fadeOut) {
      currentPower = 100;
    } else if (simTimer <= maxTime) {
      currentPower = map(simTimer, fadeOut, maxTime, 100, 0); 
    } else {
      isSimRunning = false;
      showEndMessage = true;
      currentPower = 0;
    }

    // Аудио и тресене (вързани за currentPower, за да затихват плавно)
    if (scenario === 1) {
      if (sounds.rain) sounds.rain.setVolume(map(currentPower, 0, 100, 0, 0.7));
      screenShake = 0;
    } else if (scenario === 2) {
      if (sounds.rain) sounds.rain.setVolume(map(currentPower, 0, 100, 0, 0.7));
      if (sounds.rumble) sounds.rumble.setVolume(map(currentPower, 0, 100, 0, 0.6));
      screenShake = map(currentPower, 50, 100, 0, 5);
    } else if (scenario === 3) {
      if (sounds.rumble) sounds.rumble.setVolume(map(currentPower, 0, 100, 0, 1.0));
      screenShake = map(currentPower, 0, 100, 0, 12);
    }
  } else {
    if (sounds.rain) sounds.rain.stop();
    if (sounds.rumble) sounds.rumble.stop();
  }

  push(); 
  if (screenShake > 0) translate(random(-screenShake, screenShake), random(-screenShake, screenShake));

  // 1. НЕБЕ
  let skyBrightness = (scenario !== 3 && currentPower > 0) ? map(currentPower, 0, 100, 200, 60) : 200;
  background(skyBrightness - 20, skyBrightness, skyBrightness + 30); 
  if (flash > 0) { noStroke(); fill(255, flash); rect(-100, -100, width + 200, height + 200); flash -= 15; }
  if (scenario !== 3) { image(assets.cloud, 200, 80, 250, 150); image(assets.cloud, 600, 60, 300, 180); }

  // 2. ПЛАНИНА И ЗЕМЯ
  noStroke();
  fill((scenario === 1 || scenario === 3) ? [46, 139, 87] : [139, 100, 50]); 
  beginShape(); vertex(0, 150); vertex(450, 440); vertex(800, 440); vertex(800, 500); vertex(0, 500); endShape(CLOSE);

  // 3. ПУКНАТИНИ (Сценарий 3) - Рисуват се върху земята, но под дърветата
  if (scenario === 3 && currentPower > 10) {
    stroke(80, 50, 20); 
    strokeWeight(map(currentPower, 0, 100, 3, 7));
    // Пукнатините се отварят по-бързо за краткия таймер
    let drawLimit = map(simTimer, 300, 900, 0, cracks.length); 
    for(let i=0; i < drawLimit && i < cracks.length; i++) {
      line(cracks[i].x1, cracks[i].y1, cracks[i].x2, cracks[i].y2);
    }
    noStroke();
    // Къщите падат по-рано в краткия таймер
    if (simTimer > 600) { houses[0].ruined = true; houses[1].ruined = true; } 
  }

  // 4. ВОДА (Сценарий 1) - РИСУВА СЕ ТУК, ЗА ДА Е ПОД ДЪРВЕТАТА!
  if (scenario === 1 && currentPower > 20) {
    let flowWidth = map(currentPower, 20, 100, 0, 35); 
    fill(50, 150, 255, 220);
    beginShape();
    vertex(250, map(250, 0, 450, 150, 440)); vertex(480, 450); 
    vertex(800, 460); 
    vertex(800, 460 + flowWidth); vertex(480, 450 + flowWidth); vertex(250 - flowWidth/2, map(250, 0, 450, 150, 440)); 
    endShape(CLOSE);
  }

  // 5. ДЪРВЕТА
  if (scenario === 1) {
    for (let i = 0; i < trees.length; i++) {
      if (simTimer > 1500 && random(1) > 0.999 && i % 4 === 0) trees[i].broken = true;
      image(trees[i].broken ? assets.tree1 : assets.tree, trees[i].x, trees[i].y, trees[i].size, trees[i].size * 1.2);
    }
  } else if (scenario === 2) {
    for (let s of stumps) image(assets.stump, s.x, s.y, s.size, s.size);
    image(assets.tree, trees[0].x, trees[0].y, trees[0].size, trees[0].size * 1.2);
  } else if (scenario === 3) {
    for (let i = 0; i < trees.length; i++) {
      if (currentPower > 80 && random(1) > 0.99 && i % 4 === 0) trees[i].broken = true;
      image(trees[i].broken ? assets.tree1 : assets.tree, trees[i].x, trees[i].y, trees[i].size, trees[i].size * 1.2);
    }
  }

  // 6. КЪЩИ
  for (let h of houses) {
    let img = h.ruined ? assets.house1 : assets.house;
    image(img, h.x, h.y, 110 * h.scale, 100 * h.scale);
  }

  // 7. СВЛАЧИЩЕ И КАМЪНИ
  if (scenario === 2 && currentPower > 30) {
    if (simTimer % 4 === 0 && simTimer < 2500) {
      mudChunks.push({ x: random(150, 250), y: random(160, 200), size: random(60, 100), speedX: random(3, 6), speedY: random(1.5, 3) });
    }
    for (let m of mudChunks) {
      if (m.x < 450) { m.x += m.speedX; m.y = map(m.x, 0, 450, 150, 440) + random(-15, 15); } 
      else if (m.x < 800) { m.x += m.speedX; m.y += m.speedY * 0.5; }
      if (m.size < 180) m.size += 0.3; 
      image(assets.mud, m.x, m.y, m.size, m.size * 0.7);
      if (m.x > houses[0].x - 30) houses[0].ruined = true;
      if (m.x > houses[1].x - 30) houses[1].ruined = true;
    }
  }

  if (scenario === 3 && currentPower > 80) {
    if (random(1) > 0.8) {
      let rx = random(50, 350); let ridgeY = map(rx, 0, 450, 150, 440); 
      rocks.push({ x: rx, y: ridgeY + random(10, 50), sX: random(2, 6), sY: random(3, 9) });
    }
  }
  if (scenario === 3) {
    fill(80);
    for (let r of rocks) { ellipse(r.x, r.y, 15, 15); r.x += r.sX; r.y += r.sY; }
  }

  // 8. ДЪЖД И СВЕТКАВИЦИ
  if (currentPower > 0 && scenario !== 3) {
    stroke(255, 150); strokeWeight(1.5);
    for (let i = 0; i < currentPower * 3; i++) {
      let rx = random(-100, width); let ry = random(height); line(rx, ry, rx + 10, ry + 25);
    }
    noStroke();
    if (currentPower > 80 && random(1) > 0.97) {
      flash = 180; lightningPos.x = random(200, 600); lightningTimer = 8;
      if (sounds.thunder && isAudioEnabled) sounds.thunder.play();
    }
  }
  if (lightningTimer > 0) { image(assets.lightning, lightningPos.x, lightningPos.y, 120, 350); lightningTimer--; }
  
  pop(); 

  // 9. ИНТЕРФЕЙС
  if (showEndMessage) {
    fill(0, 0, 0, 150); rect(0, 0, width, height);
    fill(255); textSize(40); textAlign(CENTER); textFont('Arial'); textStyle(BOLD);
    if (scenario === 1) { fill(100, 255, 100); text("🌳 ПРИРОДАТА УСТОЯ! Гората задържа водата.", width/2, height/2); }
    if (scenario === 2) { fill(255, 50, 50); text("⚠️ СВЛАЧИЩЕ! Без корени почвата се втечни.", width/2, height/2); }
    if (scenario === 3) { fill(255, 150, 50); text("🌋 ЗЕМЕТРЕСЕНИЕ! Природата е непредсказуема.", width/2, height/2); }
  }

  if (isSimRunning || showEndMessage) {
    // Лентата вече се пълни спрямо конкретния maxTime (1800 или 3600)
    let progress = map(simTimer, 0, maxTime, 0, width);
    if (progress > width) progress = width;
    fill(255, 255, 255, 100); rect(0, height - 10, width, 10); 
    fill(0, 150, 255); rect(0, height - 10, progress, 10); 
  }
}

function mousePressed() {
  if (!isAudioEnabled) {
    userStartAudio(); 
    if (sounds.rain) { sounds.rain.play(); sounds.rain.setVolume(0); sounds.rain.stop(); }
    if (sounds.rumble) { sounds.rumble.play(); sounds.rumble.setVolume(0); sounds.rumble.stop(); }
    isAudioEnabled = true; 
  }
}

function startVideo(scenID) {
  if (!isAudioEnabled) return; 
  scenario = scenID; simTimer = 0; isSimRunning = true; showEndMessage = false; currentPower = 0;
  if (sounds.rain) sounds.rain.stop();
  if (sounds.rumble) sounds.rumble.stop();
  
  if (scenario === 1 || scenario === 2) {
    if (sounds.rain) { sounds.rain.setVolume(0); sounds.rain.loop(); }
  }
  if (scenario === 2 || scenario === 3) {
    if (sounds.rumble) { sounds.rumble.setVolume(0); sounds.rumble.loop(); }
  }
  initObjects(); 
}

function styleButton(btn, color) {
  btn.style('background-color', color); btn.style('color', 'white');
  btn.style('padding', '12px 20px'); btn.style('border', 'none');
  btn.style('border-radius', '8px'); btn.style('font-size', '16px');
  btn.style('cursor', 'pointer'); btn.style('font-weight', 'bold');
}