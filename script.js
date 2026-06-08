document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

/**
 * Game Configuration & Constants
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 40;
const ROWS = 15;
const COLS = 15;

const ENEMY_SPEED_THRESHOLD = 8; // A mayor número, más LENTAS se mueven las dagas
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
let gameOver = false;
let gameLoopId;

const player = {
    x: 1,
    y: 1
};

const enemies = [
    { x: 7, y: 5 },
    { x: 8, y: 5 }
];

function initGame() {
    map = level1MapTemplate.map(row => [...row]);
    player.x = 1;
    player.y = 1;
    enemies[0] = { x: 7, y: 5 };
    enemies[1] = { x: 8, y: 5 };
    score = 0;
    crownsRemaining = 0;
    gameOver = false;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 2) crownsRemaining++;
        }
    }

    updateScoreBoard();
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    
    document.addEventListener('keydown', handleInput);
    
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(update, 2700 / 60);
}

function handleInput(e) {
    if (gameOver) return;
    
    let newX = player.x;
    let newY = player.y;

    switch(e.key) {
        case 'ArrowUp': case 'w': newY--; break;
        case 'ArrowDown': case 's': newY++; break;
        case 'ArrowLeft': case 'a': newX--; break;
        case 'ArrowRight': case 'd': newX++; break;
    }

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
    document.removeEventListener('keydown', handleInput);
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').innerText = `Final Score: ${score}`;
}

function triggerLevelComplete() {
    gameOver = true;
    clearInterval(gameLoopId);
    document.removeEventListener('keydown', handleInput);
    document.getElementById('levelCompleteScreen').classList.remove('hidden');
}

/**
 * Rendering
 */
function drawMap() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = map[row][col];
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
                if (imgCrown.complete) {
                    ctx.drawImage(imgCrown, x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                }
            } else if (tile === 3) {
                if (imgPotion.complete) {
                    ctx.drawImage(imgPotion, x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
            }
        }
    }
}

function drawEntity(entity, img) {
    if (img.complete) {
        ctx.drawImage(img, entity.x * TILE_SIZE, entity.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    } else {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(entity.x * TILE_SIZE, entity.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawEntity(player, imgMacbeth);
    enemies.forEach(e => drawEntity(e, imgDagger));
}

function update() {
    if (gameOver) return;

    // Incrementamos el contador en cada frame
    enemyMoveCounter++;

    // Solo movemos a los enemigos cuando el contador alcanza el umbral
    if (enemyMoveCounter >= ENEMY_SPEED_THRESHOLD) {
        updateEnemies();
        enemyMoveCounter = 0; // Reiniciamos el contador de las dagas
    }
    
    draw();
}

document.getElementById('btnStart').addEventListener('click', initGame);
document.getElementById('btnRestart').addEventListener('click', initGame);
document.getElementById('btnNextLevel').addEventListener('click', () => {
    alert("Próximamente: Lógica de Acto II");
});

drawMap();