// Act II (Level 2): Platformer Gameplay Logic
// This script interacts with the global game state declared in script.js

let playerX = 80;
let playerY = 420;
let playerVy = 0;
let isJumping = false;
const groundY = 420;
const gravity = 0.6;
const jumpForce = -13.5;

let bgScroll = 0;
let floorScroll = 0;
let guards = [];
let guardsSpawned = 0;
let guardsDefeated = 0;
let guardSpawnTimer = 0;
let kingDuncan = null;
let level2GameOver = false;
let invincibleTimer = 0;

// Expose jumpPlayer globally
window.jumpPlayer = function() {
    if (gameOver || level !== 2 || isJumping) return;
    playerVy = jumpForce;
    isJumping = true;
    
    // Spawn dust particles at feet
    spawnParticles(playerX + 20, groundY + 40, 5, '#8b5a2b');
};

// Expose shootPlayerDagger globally
window.shootPlayerDagger = function() {
    if (gameOver || level !== 2) return;
    
    let dmg = hasPotionBoost ? 45 : 30;
    // Dagger moving horizontally right
    daggers.push({
        x: playerX + 35,
        y: playerY + 25,
        vx: 8,
        vy: 0,
        damage: dmg
    });
    
    // Spawn flash particles at player hand
    spawnParticles(playerX + 40, playerY + 25, 3, '#EDE4C9');
};

// Start Level 2 platformer game loop
window.initLevel2 = function(boostState) {
    level = 2;
    macbethHp = 100;
    hasPotionBoost = boostState;
    gameOver = false;
    
    playerX = 80;
    playerY = groundY;
    playerVy = 0;
    isJumping = false;
    
    bgScroll = 0;
    floorScroll = 0;
    guards = [];
    guardsSpawned = 0;
    guardsDefeated = 0;
    guardSpawnTimer = 100; // Spawn first guard shortly
    kingDuncan = null;
    invincibleTimer = 0;
    
    daggers = [];
    particles = [];
    
    // Clear Level 1 intervals
    if (gameLoopId) clearInterval(gameLoopId);
    
    // Update HTML layout
    document.getElementById('hpValue').innerText = macbethHp;
    document.getElementById('gameTitle').innerText = "Act II: Regicide";
    document.getElementById('completeTitle').innerText = "Regicide Complete!";
    document.getElementById('scoreValue').innerText = score;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelCompleteScreen').classList.add('hidden');
    
    // Start RAF loop
    requestAnimationFrame(level2Loop);
    
    // Alert user if boosted
    if (hasPotionBoost) {
        showLevel2Message("Potion Boost Active! Dagger Damage: 45");
    }
};

let level2Message = { text: "", timer: 0 };
function showLevel2Message(txt) {
    level2Message.text = txt;
    level2Message.timer = 150;
}

function level2Loop() {
    if (gameOver || level !== 2) return;
    
    updateLevel2();
    drawLevel2();
    
    requestAnimationFrame(level2Loop);
}

function updateLevel2() {
    // 1. Macbeth Physics
    playerVy += gravity;
    playerY += playerVy;
    
    if (playerY >= groundY) {
        playerY = groundY;
        playerVy = 0;
        isJumping = false;
    }
    
    // Cooldowns
    if (invincibleTimer > 0) invincibleTimer--;
    if (level2Message.timer > 0) level2Message.timer--;
    
    // 2. Scrolling background and floor
    bgScroll = (bgScroll + 1.5) % 600;
    floorScroll = (floorScroll + 4) % 40;
    
    // 3. Spawn Guards (Up to 10)
    if (guardsSpawned < 10 && kingDuncan === null) {
        guardSpawnTimer++;
        if (guardSpawnTimer >= 150) { // every 2.5 seconds
            guardSpawnTimer = 0;
            guardsSpawned++;
            
            // Random max HP between 80 and 200
            let maxHp = Math.floor(Math.random() * 121) + 80;
            guards.push({
                x: canvas.width + 10,
                y: groundY + 5,
                hp: maxHp,
                maxHp: maxHp,
                speed: Math.random() * 1.2 + 2.4, // 2.4 to 3.6 pixels/frame
                width: 35,
                height: 45
            });
        }
    }
    
    // 4. Update Guards
    for (let i = guards.length - 1; i >= 0; i--) {
        let g = guards[i];
        g.x -= g.speed;
        
        // Remove if off-screen left
        if (g.x < -40) {
            guards.splice(i, 1);
            guardsDefeated++;
            continue;
        }
        
        // Collision with player daggers
        for (let j = daggers.length - 1; j >= 0; j--) {
            let d = daggers[j];
            // Simple bounding box collision
            if (d.x >= g.x && d.x <= g.x + g.width && d.y >= g.y && d.y <= g.y + g.height) {
                // Hit!
                g.hp -= d.damage;
                spawnParticles(d.x, d.y, 6, '#8b1e1e');
                daggers.splice(j, 1);
                
                if (g.hp <= 0) {
                    guards.splice(i, 1);
                    guardsDefeated++;
                    score += 150;
                    updateScoreBoard();
                    spawnParticles(g.x + g.width/2, g.y + g.height/2, 10, '#8b1e1e');
                    break;
                }
            }
        }
        
        // Collision with Macbeth player
        if (g.x < playerX + 35 && g.x + g.width > playerX && g.y < playerY + 45 && g.y + g.height > playerY) {
            if (invincibleTimer === 0) {
                macbethHp -= 20;
                invincibleTimer = 60; // 1 second invincibility
                document.getElementById('hpValue').innerText = macbethHp;
                spawnParticles(playerX + 20, playerY + 25, 8, '#ff0000');
                
                if (macbethHp <= 0) {
                    gameOver = true;
                    document.getElementById('gameOverScreen').classList.remove('hidden');
                    document.getElementById('finalScore').innerText = `Final Score: ${score}`;
                }
            }
        }
    }
    
    // 5. Spawn & Update King Duncan
    if (guardsSpawned === 10 && guardsDefeated === 10 && kingDuncan === null) {
        // Spawn King Duncan!
        kingDuncan = {
            x: canvas.width + 10,
            y: groundY + 5,
            hp: 1,
            maxHp: 1,
            speed: 1.0,
            width: 35,
            height: 45
        };
        showLevel2Message("King Duncan Appears! Slay him!");
    }
    
    if (kingDuncan !== null) {
        kingDuncan.x -= kingDuncan.speed;
        
        // Stop at screen center if needed, or just let him walk through
        if (kingDuncan.x < -40) {
            // Slipped away (reset)
            kingDuncan.x = canvas.width + 10;
        }
        
        // Collision with player daggers
        for (let j = daggers.length - 1; j >= 0; j--) {
            let d = daggers[j];
            if (d.x >= kingDuncan.x && d.x <= kingDuncan.x + kingDuncan.width && d.y >= kingDuncan.y && d.y <= kingDuncan.y + kingDuncan.height) {
                // Slay!
                kingDuncan = null;
                daggers.splice(j, 1);
                
                // Big golden splash
                spawnParticles(d.x, d.y, 25, '#d4af37');
                score += 1000;
                updateScoreBoard();
                
                triggerLevel2Victory();
                break;
            }
        }
        
        // Collision with Macbeth player
        if (kingDuncan && kingDuncan.x < playerX + 35 && kingDuncan.x + kingDuncan.width > playerX && kingDuncan.y < playerY + 45 && kingDuncan.y + kingDuncan.height > playerY) {
            if (invincibleTimer === 0) {
                macbethHp -= 10;
                invincibleTimer = 60;
                document.getElementById('hpValue').innerText = macbethHp;
                spawnParticles(playerX + 20, playerY + 25, 8, '#ff0000');
                
                if (macbethHp <= 0) {
                    gameOver = true;
                    document.getElementById('gameOverScreen').classList.remove('hidden');
                    document.getElementById('finalScore').innerText = `Final Score: ${score}`;
                }
            }
        }
    }
    
    // 6. Update daggers
    for (let i = daggers.length - 1; i >= 0; i--) {
        let d = daggers[i];
        d.x += d.vx;
        if (d.x > canvas.width + 20) {
            daggers.splice(i, 1);
        }
    }
    
    // 7. Update global particles & scoreboard
    updateParticles();
}

function triggerLevel2Victory() {
    gameOver = true;
    
    let completeScreen = document.getElementById('levelCompleteScreen');
    completeScreen.classList.remove('hidden');
    
    let completeTitle = document.getElementById('completeTitle');
    completeTitle.innerHTML = `"I have done the deed..."<br>Duncan is dead. Act II Victory!`;
    
    let nextBtn = document.getElementById('btnNextLevel');
    nextBtn.innerText = "Return to Kingdom";
    nextBtn.onclick = function() {
        window.location.href = "index.html";
    };
}

// Draw platformer scene
function drawLevel2() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw scrolling brick background
    ctx.fillStyle = '#1e130c'; // Dark medieval brown stone
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw brick outline detail
    ctx.strokeStyle = '#2d1e15';
    ctx.lineWidth = 2;
    for (let row = 0; row < 10; row++) {
        let y = row * 45;
        let offset = -bgScroll * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        // vertical joints
        let rowShift = (row % 2) * 50;
        for (let col = -1; col < 13; col++) {
            let cx = col * 90 + rowShift + offset;
            ctx.strokeRect(cx, y, 90, 45);
        }
    }
    
    // Draw gothic windows
    const drawWindow = (wx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wx + 30, 80, 30, Math.PI, 0);
        ctx.lineTo(wx + 60, 180);
        ctx.lineTo(wx, 180);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Window bars
        ctx.strokeStyle = '#3d281a';
        ctx.beginPath();
        ctx.moveTo(wx + 30, 50);
        ctx.lineTo(wx + 30, 180);
        ctx.moveTo(wx + 10, 120);
        ctx.lineTo(wx + 50, 120);
        ctx.stroke();
    };
    let winX1 = (180 - bgScroll * 0.4) % 650;
    if (winX1 < -60) winX1 += 650;
    drawWindow(winX1);
    
    let winX2 = (500 - bgScroll * 0.4) % 650;
    if (winX2 < -60) winX2 += 650;
    drawWindow(winX2);

    // 2. Draw scrolling cobblestone floor
    ctx.fillStyle = '#422818'; // Dirt underfloor
    ctx.fillRect(0, groundY + 45, canvas.width, canvas.height - (groundY + 45));
    
    ctx.fillStyle = '#2c1a0f'; // Cobblestones border
    ctx.fillRect(0, groundY + 40, canvas.width, 10);
    
    ctx.strokeStyle = '#23150c';
    ctx.lineWidth = 3;
    for (let c = -1; c < 16; c++) {
        let cx = c * 40 - floorScroll;
        ctx.strokeRect(cx, groundY + 40, 40, 15);
        ctx.strokeRect(cx + 15, groundY + 55, 40, 15);
    }
    
    // 3. Draw player daggers
    daggers.forEach(d => {
        if (imgDagger.complete && imgDagger.naturalWidth !== 0) {
            ctx.drawImage(imgDagger, d.x - 15, d.y - 15, 30, 30);
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 4. Draw blood/spark particles
    drawParticles();
    
    // 5. Draw Macbeth (Player)
    if (invincibleTimer === 0 || Math.floor(invincibleTimer / 4) % 2 === 0) {
        if (imgMacbeth.complete && imgMacbeth.naturalWidth !== 0) {
            ctx.drawImage(imgMacbeth, playerX, playerY, 40, 45);
        } else {
            // Draw vector Macbeth (crowned warrior)
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(playerX, playerY, 40, 45);
            // Gold crown
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.moveTo(playerX + 5, playerY);
            ctx.lineTo(playerX + 10, playerY - 8);
            ctx.lineTo(playerX + 20, playerY - 3);
            ctx.lineTo(playerX + 30, playerY - 8);
            ctx.lineTo(playerX + 35, playerY);
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw running pose / leg movement using sin
        ctx.fillStyle = '#3e2723';
        let legSway = Math.sin(time * 0.25) * 8;
        if (isJumping) {
            // jumping legs extended
            ctx.fillRect(playerX + 5, playerY + 42, 6, 8);
            ctx.fillRect(playerX + 28, playerY + 42, 6, 8);
        } else {
            // running legs alternate
            ctx.fillRect(playerX + 8, playerY + 42, 6, 8 + legSway);
            ctx.fillRect(playerX + 24, playerY + 42, 6, 8 - legSway);
        }
    }
    
    // 6. Draw Guards
    guards.forEach(g => {
        // Draw guard vector shape
        ctx.fillStyle = '#78909c'; // Iron armor
        ctx.fillRect(g.x, g.y, g.width, g.height);
        
        // Helmet (silver dome)
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.arc(g.x + g.width/2, g.y, g.width/2, Math.PI, 0);
        ctx.fill();
        
        // Crimson shield/cape decoration
        ctx.fillStyle = '#8b1e1e';
        ctx.fillRect(g.x + 8, g.y + 12, 10, 20);
        
        // Spear
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(g.x - 5, g.y - 15);
        ctx.lineTo(g.x - 5, g.y + 45);
        ctx.stroke();
        // spear tip
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.moveTo(g.x - 5, g.y - 23);
        ctx.lineTo(g.x - 9, g.y - 15);
        ctx.lineTo(g.x - 1, g.y - 15);
        ctx.closePath();
        ctx.fill();
        
        // Walking legs animation
        ctx.fillStyle = '#37474f';
        let gSway = Math.sin(time * 0.2 + g.x * 0.05) * 6;
        ctx.fillRect(g.x + 6, g.y + g.height - 3, 5, 8 + gSway);
        ctx.fillRect(g.x + g.width - 11, g.y + g.height - 3, 5, 8 - gSway);
        
        // Health Bar above guard
        let barW = 30;
        let bx = g.x + (g.width - barW)/2;
        let by = g.y - 16;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx - 1, by - 1, barW + 2, 6);
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(bx, by, barW, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(bx, by, barW * (g.hp / g.maxHp), 4);
    });
    
    // 7. Draw King Duncan
    if (kingDuncan !== null) {
        let kd = kingDuncan;
        
        // Draw royal body (purple gown)
        ctx.fillStyle = '#6a1b9a';
        ctx.fillRect(kd.x, kd.y, kd.width, kd.height);
        
        // Crown
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(kd.x + 5, kd.y);
        ctx.lineTo(kd.x + 8, kd.y - 8);
        ctx.lineTo(kd.x + 18, kd.y - 4);
        ctx.lineTo(kd.x + 28, kd.y - 8);
        ctx.lineTo(kd.x + 30, kd.y);
        ctx.closePath();
        ctx.fill();
        
        // Grey beard & hair
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(kd.x + 5, kd.y + 4, 25, 12);
        ctx.fillStyle = '#ffe0b2'; // Face skin
        ctx.fillRect(kd.x + 10, kd.y + 5, 15, 6);
        
        // Walking legs
        ctx.fillStyle = '#4a148c';
        let kdSway = Math.sin(time * 0.15) * 4;
        ctx.fillRect(kd.x + 8, kd.y + kd.height - 3, 6, 8 + kdSway);
        ctx.fillRect(kd.x + kd.width - 14, kd.y + kd.height - 3, 6, 8 - kdSway);
        
        // Health bar (1 HP)
        let barW = 32;
        let bx = kd.x + (kd.width - barW)/2;
        let by = kd.y - 18;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx - 1, by - 1, barW + 2, 6);
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(bx, by, barW, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(bx, by, barW * (kd.hp / kd.maxHp), 4);
    }
    
    // 8. Draw banner message
    if (level2Message.timer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(28, 20, 15, 0.85)';
        ctx.fillRect(40, 260, 520, 60);
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 260, 520, 60);
        
        ctx.fillStyle = '#D4AF37';
        ctx.font = "bold 16px 'MedievalSharp', cursive";
        ctx.textAlign = 'center';
        ctx.fillText(level2Message.text, 300, 296);
        ctx.restore();
    }
}
