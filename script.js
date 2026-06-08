document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Pintar el mapa inicial de fondo antes de darle a Start
    drawMap();
});

/**
 * Game Configuration & Constants
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 40;
const ROWS = 15;
const COLS = 15;

const ENEMY_SPEED_THRESHOLD = 8;
let enemyMoveCounter = 0;

/**
 * Assets Loading
 */
const imgMacbeth = new Image();
imgMacbeth.src = 'assets/macbeth_sprite.png';

const imgDagger = new Image();
imgDagger.src = 'assets/dagger_sprite.png';

const imgCrown = new Image();
imgCrown.src = 'assets/crown_point.png';

const imgPotion = new Image();
imgPotion.src = 'assets/witch_potion.png';

// 0: Empty, 1: Wall, 2: Crown, 3: Power-up
const level1MapTemplate = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,1,2,2,2,2,2,2,3,1],
    [1,2,1,2,1,2,1,2,1,1,1,1,1,2,1],
    [1,2,1,2,2,2,2,2,2,2,2,2,1,2,1],
    [1,2,1,2,1,1,0,1,1,1,1,2,1,2,1],
    [1,2,2,2,2,0,0,0,0,0,1,2,2,2,1],
    [1,1,1,2,1,0,1,0,1,0,1,2,1,1,1],
    [1,2,2,2,2,0,1,0,1,0,2,2,2,2,1],
    [1,1,1,2,1,0,1,0,1,0,1,2,1,1,1],
    [1,2,2,2,1,0,0,0,0,0,1,2,2,2,1],
    [1,2,1,2,1,1,1,2,1,1,1,2,1,2,1],
    [1,2,1,2,2,2,2,2,2,2,2,2,1,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,2,2,2,2,1,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = [];
let score = 0;
let crownsRemaining = 0;
let gameOver = true; // Inicia true para que no se mueva antes de darle start
let gameLoopId;

// Macbeth configuration
let level = 1;
let macbethHp = 100;
let hasPotionBoost = false;
let playerInvincibleTimer = 0;
const player = { x: 1, y: 1, dirX: 1, dirY: 0 };

// Enemies (Guardians of the crown)
const enemies = [
    { x: 7, y: 5, hp: 60, maxHp: 60 },
    { x: 8, y: 5, hp: 60, maxHp: 60 }
];

// Objects & particles
let daggers = [];
let particles = [];
let level1Banner = { text: "", timer: 0 };

/**
 * Core Logic
 */
function initGame() {
    level = 1;
    macbethHp = 100;
    hasPotionBoost = false;
    playerInvincibleTimer = 0;
    daggers = [];
    particles = [];
    level1Banner = { text: "", timer: 0 };
    
    document.getElementById('hpValue').innerText = macbethHp;
    document.getElementById('gameTitle').innerText = "Act I: Labyrinth";
    document.getElementById('completeTitle').innerText = "Victory is yours...";

    map = level1MapTemplate.map(row => [...row]);
    player.x = 1;
    player.y = 1;
    player.dirX = 1;
    player.dirY = 0;
    
    enemies[0] = { x: 7, y: 5, hp: 60, maxHp: 60 };
    enemies[1] = { x: 8, y: 5, hp: 60, maxHp: 60 };
    
    score = 0;
    crownsRemaining = 0;
    gameOver = false;
    enemyMoveCounter = 0;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 2) crownsRemaining++;
        }
    }

    updateScoreBoard();
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(update, 2900 / 60); // Mantener velocidad original
}

function movePlayer(dx, dy) {
    if (gameOver || level === 2) return;
    
    // Set looking direction
    if (dx !== 0 || dy !== 0) {
        player.dirX = dx;
        player.dirY = dy;
    }
    
    let newX = player.x + dx;
    let newY = player.y + dy;

    if (map[newY][newX] !== 1) {
        player.x = newX;
        player.y = newY;
        checkCollection();
    }
}

function checkCollection() {
    const tile = map[player.y][player.x];
    if (tile === 2) {
        score += 10;
        crownsRemaining--;
        map[player.y][player.x] = 0;
        spawnParticles(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE + TILE_SIZE/2, 5, '#D4AF37');
    } else if (tile === 3) {
        score += 50;
        map[player.y][player.x] = 0;
        hasPotionBoost = true;
        showLevel1Banner("Potion Collected! Dagger Damage +50%!");
        spawnParticles(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE + TILE_SIZE/2, 8, '#800080');
    }
    
    updateScoreBoard();

    if (crownsRemaining <= 0) {
        triggerLevelComplete();
    }
}

function showLevel1Banner(txt) {
    level1Banner.text = txt;
    level1Banner.timer = 120; // ~2 seconds
}

// Spawns daggers in current direction
function shootDagger() {
    if (gameOver) return;
    if (level === 2) {
        if (typeof shootPlayerDagger === 'function') {
            shootPlayerDagger();
        }
        return;
    }
    
    // Level 1 Dagger Throwing
    let dmg = hasPotionBoost ? 45 : 30;
    daggers.push({
        x: player.x * TILE_SIZE + TILE_SIZE / 2,
        y: player.y * TILE_SIZE + TILE_SIZE / 2,
        vx: player.dirX * 6,
        vy: player.dirY * 6,
        damage: dmg
    });
}

function updateDaggers() {
    for (let i = daggers.length - 1; i >= 0; i--) {
        let d = daggers[i];
        d.x += d.vx;
        d.y += d.vy;
        
        let gridX = Math.floor(d.x / TILE_SIZE);
        let gridY = Math.floor(d.y / TILE_SIZE);
        
        // Wall collision
        if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS || map[gridY][gridX] === 1) {
            daggers.splice(i, 1);
            continue;
        }
        
        // Enemy collision
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];
            let enemyScreenX = enemy.x * TILE_SIZE + TILE_SIZE/2;
            let enemyScreenY = enemy.y * TILE_SIZE + TILE_SIZE/2;
            let dist = Math.hypot(d.x - enemyScreenX, d.y - enemyScreenY);
            
            if (dist < 20) {
                enemy.hp -= d.damage;
                hit = true;
                
                spawnParticles(enemyScreenX, enemyScreenY, 6, '#8b1e1e');
                
                if (enemy.hp <= 0) {
                    enemies.splice(j, 1);
                    score += 100;
                    updateScoreBoard();
                }
                break;
            }
        }
        
        if (hit) {
            daggers.splice(i, 1);
        }
    }
}

// Particle System
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 2,
            color: color,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function updateEnemies() {
    enemies.forEach(enemy => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        
        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else if (dy !== 0) {
            moveY = dy > 0 ? 1 : -1;
        }

        if (map[enemy.y + moveY][enemy.x + moveX] !== 1) {
            enemy.x += moveX;
            enemy.y += moveY;
        } else {
            const dirs = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
            const validDirs = dirs.filter(d => map[enemy.y + d.y][enemy.x + d.x] !== 1);
            if (validDirs.length > 0) {
                const randomDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                enemy.x += randomDir.x;
                enemy.y += randomDir.y;
            }
        }

        // Check player collision
        if (enemy.x === player.x && enemy.y === player.y) {
            if (playerInvincibleTimer === 0) {
                macbethHp -= 20;
                playerInvincibleTimer = 60; // 1.2 segundos invencibilidad
                document.getElementById('hpValue').innerText = macbethHp;
                spawnParticles(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE + TILE_SIZE/2, 8, '#ff0000');
                if (macbethHp <= 0) {
                    triggerGameOver();
                }
            }
        }
    });
}

function updateScoreBoard() {
    document.getElementById('scoreValue').innerText = score;
}

function triggerGameOver() {
    gameOver = true;
    clearInterval(gameLoopId);
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').innerText = `Final Score: ${score}`;
}

function triggerLevelComplete() {
    gameOver = true;
    clearInterval(gameLoopId);
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
}

/**
 * Rendering
 */
function drawMap() {
    const currentMap = map.length > 0 ? map : level1MapTemplate;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = currentMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            ctx.fillStyle = '#1C140F';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (tile === 1) { 
                ctx.fillStyle = '#8B5A2B';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#2C1F14';
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (tile === 2) {
                if (imgCrown.complete && imgCrown.naturalWidth !== 0) {
                    ctx.drawImage(imgCrown, x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                } else {
                    ctx.fillStyle = '#D4AF37';
                    ctx.beginPath();
                    ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (tile === 3) {
                if (imgPotion.complete && imgPotion.naturalWidth !== 0) {
                    ctx.drawImage(imgPotion, x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                } else {
                    ctx.fillStyle = '#800080';
                    ctx.fillRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                }
            }
        }
    }
}

function drawEntity(entity, img, fallbackColor) {
    if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, entity.x * TILE_SIZE, entity.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(entity.x * TILE_SIZE, entity.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    
    // Draw daggers
    daggers.forEach(d => {
        if (imgDagger.complete && imgDagger.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(d.x, d.y);
            let angle = Math.atan2(d.vy, d.vx);
            ctx.rotate(angle);
            ctx.drawImage(imgDagger, -15, -15, 30, 30);
            ctx.restore();
        } else {
            ctx.fillStyle = '#EDE4C9';
            ctx.beginPath();
            ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    drawParticles();

    // Draw Macbeth player (flash if invincible)
    if (playerInvincibleTimer === 0 || Math.floor(playerInvincibleTimer / 4) % 2 === 0) {
        drawEntity(player, imgMacbeth, '#00FF00');
    }

    // Draw Enemies (floating daggers)
    enemies.forEach(e => {
        drawEntity(e, imgDagger, '#FF0000');
        
        // Draw small health bar
        if (e.hp < e.maxHp) {
            let barWidth = 30;
            let barHeight = 4;
            let bx = e.x * TILE_SIZE + (TILE_SIZE - barWidth) / 2;
            let by = e.y * TILE_SIZE - 6;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(bx, by, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(bx, by, barWidth * (e.hp / e.maxHp), barHeight);
        }
    });
    
    // Draw level 1 banner
    if (level1Banner.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(28, 20, 15, 0.85)';
        ctx.fillRect(40, 260, 520, 60);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 260, 520, 60);
        
        ctx.fillStyle = '#D4AF37';
        ctx.font = "bold 16px 'MedievalSharp', cursive";
        ctx.textAlign = 'center';
        ctx.fillText(level1Banner.text, 300, 296);
        ctx.restore();
    }
}

function update() {
    if (gameOver || level === 2) return;

    if (playerInvincibleTimer > 0) playerInvincibleTimer--;

    enemyMoveCounter++;
    if (enemyMoveCounter >= ENEMY_SPEED_THRESHOLD) {
        updateEnemies();
        enemyMoveCounter = 0;
    }
    
    updateDaggers();
    updateParticles();
    
    if (level1Banner.timer > 0) {
        level1Banner.timer--;
    }

    draw();
}

/**
 * Event Listeners & Controls
 */
document.getElementById('btnStart').addEventListener('click', initGame);
document.getElementById('btnRestart').addEventListener('click', () => {
    if (level === 1) {
        initGame();
    } else {
        if (typeof initLevel2 === 'function') {
            initLevel2(hasPotionBoost);
        }
    }
});

document.getElementById('btnNextLevel').addEventListener('click', () => {
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    if (typeof initLevel2 === 'function') {
        initLevel2(hasPotionBoost);
    }
});

document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    if (level === 2) {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            if (typeof jumpPlayer === 'function') jumpPlayer();
        }
        if (e.key === ' ') {
            shootDagger();
        }
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp': case 'w': movePlayer(0, -1); break;
        case 'ArrowDown': case 's': movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': movePlayer(1, 0); break;
        case ' ': shootDagger(); break;
    }
});

const addControl = (id, dx, dy) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    
    const handler = (e) => {
        e.preventDefault();
        if (gameOver) return;
        if (level === 2) {
            if (id === 'btnUp') {
                if (typeof jumpPlayer === 'function') jumpPlayer();
            }
            return;
        }
        movePlayer(dx, dy);
    };
    
    btn.addEventListener('touchstart', handler, { passive: false });
    btn.addEventListener('mousedown', handler);
};

addControl('btnUp', 0, -1);
addControl('btnDown', 0, 1);
addControl('btnLeft', -1, 0);
addControl('btnRight', 1, 0);

// Mobile Shoot Action button binding
const shootBtn = document.getElementById('btnShoot');
if (shootBtn) {
    const shootHandler = (e) => {
        e.preventDefault();
        shootDagger();
    };
    shootBtn.addEventListener('touchstart', shootHandler, { passive: false });
    shootBtn.addEventListener('mousedown', shootHandler);
}