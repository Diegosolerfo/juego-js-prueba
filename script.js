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

const player = { x: 1, y: 1 };
const enemies = [
    { x: 7, y: 5 },
    { x: 8, y: 5 }
];

/**
 * Core Logic
 */
function initGame() {
    map = level1MapTemplate.map(row => [...row]);
    player.x = 1;
    player.y = 1;
    enemies[0] = { x: 7, y: 5 };
    enemies[1] = { x: 8, y: 5 };
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
    gameLoopId = setInterval(update, 2900 / 60); // 60 FPS
}

function movePlayer(dx, dy) {
    if (gameOver) return;
    
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
    } else if (tile === 3) {
        score += 50;
        map[player.y][player.x] = 0;
    }
    
    updateScoreBoard();

    if (crownsRemaining <= 0) {
        triggerLevelComplete();
    }
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

        if (enemy.x === player.x && enemy.y === player.y) {
            triggerGameOver();
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
    // Si el mapa aún no se inicializa, dibujamos el template base visualmente
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
    drawEntity(player, imgMacbeth, '#00FF00'); // Jugador verde si falla imagen
    enemies.forEach(e => drawEntity(e, imgDagger, '#FF0000')); // Dagas rojas si falla imagen
}

function update() {
    if (gameOver) return;

    enemyMoveCounter++;
    if (enemyMoveCounter >= ENEMY_SPEED_THRESHOLD) {
        updateEnemies();
        enemyMoveCounter = 0;
    }
    
    draw();
}

/**
 * Event Listeners & Controls
 */
document.getElementById('btnStart').addEventListener('click', initGame);
document.getElementById('btnRestart').addEventListener('click', initGame);
document.getElementById('btnNextLevel').addEventListener('click', () => {
    alert("Próximamente: Lógica de Acto II");
});

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': case 'w': movePlayer(0, -1); break;
        case 'ArrowDown': case 's': movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': movePlayer(1, 0); break;
    }
});

const addControl = (id, dx, dy) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    
    btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        movePlayer(dx, dy); 
    });
    btn.addEventListener('mousedown', (e) => { 
        e.preventDefault(); 
        movePlayer(dx, dy); 
    });
};

addControl('btnUp', 0, -1);
addControl('btnDown', 0, 1);
addControl('btnLeft', -1, 0);
addControl('btnRight', 1, 0);