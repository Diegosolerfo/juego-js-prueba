/**
 * act3.js — Act III: The Chase
 * Pseudo-3D lane-runner. Macbeth flees through Birnam Wood.
 * Left/Right = switch lanes. Up = jump. Dodge rocks & trees.
 * Survive 60 seconds to escape.
 */

class Act3 {
    init(game) {
        this.game = game;
        this.W = game.canvas.width;
        this.H = game.canvas.height;
        this._reset();
    }

    _reset() {
        const W = this.W, H = this.H;
        // Perspective constants
        this.HORIZON    = H * 0.42;
        this.GROUND_BOT = H;
        this.LANES      = [-1, 0, 1]; // left, center, right
        this.laneXPct   = [0.25, 0.5, 0.75]; // screen X fractions at horizon

        // Player
        this.playerLane    = 1;     // index 0,1,2
        this.targetLane    = 1;
        this.laneSlide     = 0;     // 0..1 slide progress
        this.jumpY         = 0;     // extra upward offset (0=ground)
        this.jumpVY        = 0;
        this.isJumping     = false;
        this.invTimer      = 0;
        this.particles     = [];

        // Obstacle pool
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.6;

        // Distance / score
        this.distanceTraveled = 0;
        this.goalDistance     = 100;  // meters
        this.baseSpeed        = 220;
        this.speed            = this.baseSpeed;

        // Input edge detection
        this._prevLeft = this._prevRight = this._prevUp = false;

        // Time survived HUD
        this.timeElapsed = 0;
    }

    cleanup() {}

    onResize(w, h) {
        this.W = w; this.H = h;
        this.HORIZON    = h * 0.42;
        this.GROUND_BOT = h;
    }

    update(dt, keys) {
        // ── Lane switching ────────────────────────────────────
        if (keys.left && !this._prevLeft && this.targetLane > 0) {
            this.targetLane--;
        }
        if (keys.right && !this._prevRight && this.targetLane < 2) {
            this.targetLane++;
        }
        this._prevLeft  = keys.left;
        this._prevRight = keys.right;

        // Slide toward target lane
        if (this.playerLane !== this.targetLane) {
            this.laneSlide += dt * 6;
            if (this.laneSlide >= 1) { this.playerLane = this.targetLane; this.laneSlide = 0; }
        }

        // ── Jump ─────────────────────────────────────────────
        if (keys.up && !this._prevUp && !this.isJumping) {
            this.jumpVY = -420;
            this.isJumping = true;
        }
        this._prevUp = keys.up;

        if (this.isJumping) {
            this.jumpY  += this.jumpVY * dt;
            this.jumpVY += 980 * dt;   // gravity
            if (this.jumpY >= 0) { this.jumpY = 0; this.jumpVY = 0; this.isJumping = false; }
        }

        // ── Speed ramps up ────────────────────────────────────
        this.speed = this.baseSpeed + this.distanceTraveled * 0.12;
        this.distanceTraveled += this.speed * dt * 0.01;
        this.timeElapsed += dt;
        this.game.addScore(Math.floor(this.speed * dt * 0.05));

        // ── Spawn obstacles ───────────────────────────────────
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.7, 1.6 - this.distanceTraveled * 0.001);
            const lane = Math.floor(Math.random() * 3);
            const type = Math.random() > 0.4 ? 'rock' : 'tree';
            this.obstacles.push({ lane, z: 0, type }); // z=0 horizon, grows to 1
        }

        // ── Update obstacles ──────────────────────────────────
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.z += (this.speed / 400) * dt;  // depth approach speed

            if (ob.z >= 1.1) { this.obstacles.splice(i, 1); continue; }

            // Collision zone: z close to player (z≈0.85..1.05), same lane, not jumping
            const laneMatch = ob.lane === (this.laneSlide > 0.5 ? this.targetLane : this.playerLane);
            const depthHit  = ob.z > 0.84 && ob.z < 1.02;
            const notJumping = this.jumpY > -50;
            if (laneMatch && depthHit && notJumping && this.invTimer <= 0) {
                this.obstacles.splice(i, 1);
                const cx = this._laneScreenX(this.playerLane), cy = this.H * 0.75;
                this._spawnParticles(cx, cy, 10, '#8b5a2b');
                if (!this.game.damagePlayer(25)) {
                    this.invTimer = 1.5;
                    this.game.showBanner('Obstacle hit! −25 HP');
                }
                continue;
            }
        }

        // ── Invincibility ────────────────────────────────────
        if (this.invTimer > 0) this.invTimer -= dt;

        // ── Particles ────────────────────────────────────────
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.alpha -= p.decay; return p.alpha > 0;
        });

        // ── Goal reached ──────────────────────────────────────
        if (this.distanceTraveled >= this.goalDistance) {
            this.game.showVictory(
                'Into the Forest!',
                'Macbeth has slipped through Birnam Wood. But the witches\' prophecy echoes still...',
                '🌲'
            );
        }
    }

    draw(ctx, W, H) {
        const HOR = this.HORIZON;

        // ── Sky ───────────────────────────────────────────────
        const skyGrd = ctx.createLinearGradient(0, 0, 0, HOR);
        skyGrd.addColorStop(0, '#0a0814');
        skyGrd.addColorStop(1, '#1a1030');
        ctx.fillStyle = skyGrd;
        ctx.fillRect(0, 0, W, HOR);

        // Stars
        ctx.fillStyle = 'rgba(255,255,220,0.5)';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 137.5) % W, sy = (i * 73) % HOR;
            ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI*2); ctx.fill();
        }

        // ── Ground perspective ────────────────────────────────
        const grdGrd = ctx.createLinearGradient(0, HOR, 0, H);
        grdGrd.addColorStop(0, '#1a2a0a');
        grdGrd.addColorStop(1, '#0d150a');
        ctx.fillStyle = grdGrd;
        ctx.fillRect(0, HOR, W, H - HOR);

        // Lane lines (perspective converge to center vanishing point)
        const VPX = W * 0.5, VPY = HOR;
        ctx.strokeStyle = 'rgba(80,120,40,0.4)';
        ctx.lineWidth = 1;
        for (let l = 0; l < 4; l++) {
            const botX = W * (l / 3);
            ctx.beginPath();
            ctx.moveTo(VPX, VPY);
            ctx.lineTo(botX, H);
            ctx.stroke();
        }

        // Forest sides (trees getting bigger from center out)
        this._drawForestSide(ctx, W, H, HOR, -1);
        this._drawForestSide(ctx, W, H, HOR,  1);

        // ── Obstacles ────────────────────────────────────────
        this.obstacles.forEach(ob => {
            const pct  = Math.pow(ob.z, 1.4);  // perspective scaling
            const sx   = this._laneScreenXFromLane(ob.lane, W, pct);
            const sy   = HOR + (H - HOR) * pct;
            const size = Math.max(4, 60 * pct);
            if (ob.type === 'rock') {
                this._drawRock(ctx, sx, sy, size);
            } else {
                this._drawObstacleTree(ctx, sx, sy, size);
            }
        });

        // ── Player (Macbeth) ──────────────────────────────────
        const flash = this.invTimer > 0 && Math.floor(this.invTimer * 8) % 2 === 0;
        if (!flash) {
            // Current X interpolated between lanes
            let curLane = this.playerLane;
            let interpX;
            if (this.playerLane !== this.targetLane) {
                interpX = this._lerp(
                    this.laneXPct[this.playerLane] * W,
                    this.laneXPct[this.targetLane] * W,
                    this.laneSlide
                );
            } else {
                interpX = this.laneXPct[curLane] * W;
            }
            const py = H * 0.73 + this.jumpY * 0.22;
            this._drawPlayer(ctx, interpX, py, flash);
        }

        // ── Particles ────────────────────────────────────────
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // ── HUD overlay ───────────────────────────────────────
        const pct = this.distanceTraveled / this.goalDistance;
        ctx.fillStyle = 'rgba(11,8,6,0.6)';
        ctx.fillRect(W-150, 8, 142, 42);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(W-142, 20, 126 * pct, 8);
        ctx.fillStyle = '#1a3a10'; ctx.strokeStyle = '#2ecc71'; ctx.lineWidth=1;
        ctx.strokeRect(W-142, 20, 126, 8);
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 10px Cinzel'; ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(pct*100)}% escaped`, W-12, 18);
        ctx.fillStyle = '#8b5a2b'; ctx.font = '10px Cinzel';
        ctx.fillText(`⏱ ${Math.floor(this.timeElapsed)}s`, W-12, 44);
    }

    // ── Draw Helpers ──────────────────────────────────────────

    _laneScreenX(laneIdx) {
        return this.laneXPct[laneIdx] * this.W;
    }

    _laneScreenXFromLane(laneIdx, W, depthPct) {
        const centerX = W * 0.5;
        const botX    = this.laneXPct[laneIdx] * W;
        return this._lerp(centerX, botX, depthPct);
    }

    _lerp(a, b, t) { return a + (b-a) * Math.min(1, Math.max(0, t)); }

    _drawPlayer(ctx, x, y, flash) {
        const h = 80, w = 36;
        // Robe
        ctx.fillStyle = '#2c1e17';
        ctx.beginPath();
        ctx.moveTo(x-w/2, y+h*0.1);
        ctx.lineTo(x-w/2-8, y+h);
        ctx.lineTo(x+w/2+8, y+h);
        ctx.lineTo(x+w/2, y+h*0.1);
        ctx.closePath(); ctx.fill();
        // Head
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath(); ctx.arc(x, y, w*0.42, 0, Math.PI*2); ctx.fill();
        // Crown
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(x-w*0.44, y-w*0.42);
        ctx.lineTo(x-w*0.28, y-w*0.78);
        ctx.lineTo(x, y-w*0.55);
        ctx.lineTo(x+w*0.28, y-w*0.78);
        ctx.lineTo(x+w*0.44, y-w*0.42);
        ctx.closePath(); ctx.fill();
        // Running arms
        ctx.strokeStyle = '#2c1e17'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        const armSwing = Math.sin(Date.now()*0.015) * 18;
        ctx.beginPath(); ctx.moveTo(x, y+h*0.25); ctx.lineTo(x-w*0.6, y+h*0.5+armSwing); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y+h*0.25); ctx.lineTo(x+w*0.6, y+h*0.5-armSwing); ctx.stroke();
    }

    _drawRock(ctx, x, y, size) {
        ctx.fillStyle = '#6d6d6d';
        ctx.beginPath();
        ctx.ellipse(x, y, size*0.8, size*0.6, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.ellipse(x-size*0.15, y-size*0.2, size*0.3, size*0.22, -0.3, 0, Math.PI*2);
        ctx.fill();
    }

    _drawObstacleTree(ctx, x, y, size) {
        // Trunk
        ctx.fillStyle = '#4a321a';
        ctx.fillRect(x-size*0.12, y-size*0.6, size*0.24, size*0.65);
        // Foliage
        ctx.fillStyle = '#1b4d22';
        ctx.beginPath(); ctx.moveTo(x, y-size*1.6); ctx.lineTo(x-size*0.6, y-size*0.6); ctx.lineTo(x+size*0.6, y-size*0.6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y-size*2.0); ctx.lineTo(x-size*0.45, y-size*1.3); ctx.lineTo(x+size*0.45, y-size*1.3); ctx.closePath(); ctx.fill();
    }

    _drawForestSide(ctx, W, H, HOR, side) {
        ctx.fillStyle = '#0d1a08';
        const treeCount = 8;
        for (let i = 0; i < treeCount; i++) {
            const t = i / treeCount;
            const x = side < 0
                ? W * 0.5 * (1 - t) * 0.9
                : W - W * 0.5 * (1 - t) * 0.9;
            const y = HOR + (H - HOR) * t;
            const h = (H - HOR) * t * 0.9;
            const w = h * 0.4;
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + w*side, y + h*0.7); ctx.lineTo(x, y+h); ctx.closePath();
            ctx.fill();
        }
    }

    _spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6,
                size: Math.random()*5+2, color, alpha: 1, decay: 0.03+Math.random()*0.02
            });
        }
    }
}

GAME.registerAct(3, new Act3());
