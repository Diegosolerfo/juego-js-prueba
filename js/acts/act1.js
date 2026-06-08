/**
 * act1.js — Act I: The Labyrinth
 * Top-down tile-map escape. Player collects crowns and evades guards.
 * NO combat — player cannot attack; enemies cannot be killed.
 * Potion pickup grants potionBoost for Act II.
 */

class Act1 {
    init(game) {
        this.game = game;
        this.W = game.canvas.width;
        this.H = game.canvas.height;

        // Tile constants
        this.COLS  = 15;
        this.ROWS  = 15;
        this.tileS = Math.floor(Math.min(this.W, this.H) / this.COLS);

        // Offsets to center the map
        this.offX = Math.floor((this.W - this.tileS * this.COLS) / 2);
        this.offY = Math.floor((this.H - this.tileS * this.ROWS) / 2);

        // Map: 0=floor, 1=wall, 2=crown, 3=potion
        this.mapTemplate = [
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
            [1,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ];

        this._reset();

        // Load images
        this.imgPlayer = new Image(); this.imgPlayer.src = 'assets/macbeth_sprite.png';
        this.imgCrown  = new Image(); this.imgCrown.src  = 'assets/crown_point.png';
        this.imgPotion = new Image(); this.imgPotion.src = 'assets/witch_potion.png';
        this.imgDagger = new Image(); this.imgDagger.src = 'assets/dagger_sprite.png';
    }

    _reset() {
        this.map = this.mapTemplate.map(r => [...r]);
        this.player = { x: 1, y: 1, dir: 'right' };

        this.guards = [
            { x: 7, y: 5, dir: 'left',  moveTimer: 0, hp: 1 },
            { x: 8, y: 8, dir: 'right', moveTimer: 0, hp: 1 },
        ];

        this.crownsLeft = 0;
        for (let r = 0; r < this.ROWS; r++)
            for (let c = 0; c < this.COLS; c++)
                if (this.map[r][c] === 2) this.crownsLeft++;

        this.invTimer      = 0;
        this.particles     = [];
        this.moveTimer     = 0;
        this.guardMoveTimer= 0;
        this.stepInterval  = 0.1; // seconds between player steps
        this.guardInterval = 0.40;
    }

    cleanup() {}

    onResize(w, h) {
        this.W = w; this.H = h;
        this.tileS = Math.floor(Math.min(w, h) / this.COLS);
        this.offX  = Math.floor((w - this.tileS * this.COLS) / 2);
        this.offY  = Math.floor((h - this.tileS * this.ROWS) / 2);
    }

    update(dt, keys) {
        // ── Player movement (tile-step) ──────────────────────
        this.moveTimer += dt;
        if (this.moveTimer >= this.stepInterval) {
            this.moveTimer = 0;
            let dx = 0, dy = 0;
            if (keys.up)    { dy = -1; this.player.dir = 'up'; }
            if (keys.down)  { dy =  1; this.player.dir = 'down'; }
            if (keys.left)  { dx = -1; this.player.dir = 'left'; }
            if (keys.right) { dx =  1; this.player.dir = 'right'; }

            const nx = this.player.x + dx, ny = this.player.y + dy;
            if (dx !== 0 || dy !== 0) {
                if (this._walkable(nx, ny)) {
                    this.player.x = nx; this.player.y = ny;
                    this._collectTile();
                }
            }
        }

        // ── Guard movement (chase) ───────────────────────────
        this.guardMoveTimer += dt;
        if (this.guardMoveTimer >= this.guardInterval) {
            this.guardMoveTimer = 0;
            this.guards.forEach(g => this._moveGuard(g));
        }

        // ── Invincibility cooldown ───────────────────────────
        if (this.invTimer > 0) this.invTimer -= dt;

        // ── Collision player ↔ guards ────────────────────────
        this.guards.forEach(g => {
            if (g.x === this.player.x && g.y === this.player.y && this.invTimer <= 0) {
                if (this.game.damagePlayer(20)) return; // died
                this.invTimer = 1.5;
                this._spawnParticles(this._tileCenter(this.player.x, this.player.y), 8, '#ff4444');
                this.game.showBanner('Guard caught you! −20 HP');
            }
        });

        // ── Particles ────────────────────────────────────────
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
            return p.alpha > 0;
        });
    }

    draw(ctx, W, H) {
        ctx.fillStyle = '#0b0806';
        ctx.fillRect(0, 0, W, H);

        const ts = this.tileS, ox = this.offX, oy = this.offY;

        // ── Tiles ────────────────────────────────────────────
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const px = ox + c * ts, py = oy + r * ts;
                const tile = this.map[r][c];
                if (tile === 1) {
                    ctx.fillStyle = '#5c3a1a';
                    ctx.fillRect(px, py, ts, ts);
                    ctx.strokeStyle = '#3d2010'; ctx.lineWidth = 1;
                    ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
                } else {
                    ctx.fillStyle = '#1e1510';
                    ctx.fillRect(px, py, ts, ts);
                    if (tile === 2) this._drawSprite(ctx, this.imgCrown,  px+ts*0.15, py+ts*0.15, ts*0.7, ts*0.7, '#d4af37', () => this._drawCrownFB(ctx, px, py, ts));
                    if (tile === 3) this._drawSprite(ctx, this.imgPotion, px+ts*0.1,  py+ts*0.1,  ts*0.8, ts*0.8, '#800080', () => this._drawPotionFB(ctx, px, py, ts));
                }
            }
        }

        // ── Guards ───────────────────────────────────────────
        this.guards.forEach(g => {
            const gx = ox + g.x * ts, gy = oy + g.y * ts;
            this._drawSprite(ctx, this.imgDagger, gx+ts*0.1, gy+ts*0.1, ts*0.8, ts*0.8, '#ff4444', () => {
                ctx.fillStyle = '#b0bec5';
                ctx.fillRect(gx + ts*0.2, gy + ts*0.15, ts*0.6, ts*0.7);
                ctx.fillStyle = '#78909c';
                ctx.beginPath(); ctx.arc(gx + ts*0.5, gy + ts*0.15, ts*0.28, Math.PI, 0); ctx.fill();
                ctx.fillStyle = '#8b1e1e';
                ctx.fillRect(gx + ts*0.3, gy + ts*0.4, ts*0.2, ts*0.3);
            });
        });

        // ── Player ───────────────────────────────────────────
        const flash = this.invTimer > 0 && Math.floor(this.invTimer * 8) % 2 === 0;
        if (!flash) {
            const px2 = ox + this.player.x * ts, py2 = oy + this.player.y * ts;
            this._drawSprite(ctx, this.imgPlayer, px2, py2, ts, ts, '#00ff00', () => {
                ctx.fillStyle = '#2c1e17';
                ctx.fillRect(px2 + ts*0.2, py2 + ts*0.1, ts*0.6, ts*0.8);
                ctx.fillStyle = '#ffe4c4';
                ctx.beginPath(); ctx.arc(px2 + ts*0.5, py2 + ts*0.22, ts*0.2, 0, Math.PI*2); ctx.fill();
                // Crown
                ctx.fillStyle = '#d4af37';
                ctx.beginPath();
                ctx.moveTo(px2+ts*0.28, py2+ts*0.06);
                ctx.lineTo(px2+ts*0.38, py2-ts*0.04);
                ctx.lineTo(px2+ts*0.5,  py2+ts*0.01);
                ctx.lineTo(px2+ts*0.62, py2-ts*0.04);
                ctx.lineTo(px2+ts*0.72, py2+ts*0.06);
                ctx.closePath(); ctx.fill();
            });
        }

        // ── Particles ────────────────────────────────────────
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // ── HUD: crowns left ─────────────────────────────────
        ctx.fillStyle = 'rgba(11,8,6,0.65)';
        ctx.fillRect(ox, oy - 22, 120, 20);
        ctx.fillStyle = '#d4af37';
        ctx.font = `bold ${Math.max(10, ts*0.35)}px Cinzel`;
        ctx.textAlign = 'left';
        ctx.fillText(`👑 ${this.crownsLeft} left`, ox + 4, oy - 6);
    }

    // ── Helpers ───────────────────────────────────────────────

    _walkable(x, y) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return false;
        return this.map[y][x] !== 1;
    }

    _collectTile() {
        const t = this.map[this.player.y][this.player.x];
        const c = this._tileCenter(this.player.x, this.player.y);
        if (t === 2) {
            this.map[this.player.y][this.player.x] = 0;
            this.crownsLeft--;
            this.game.addScore(10);
            this._spawnParticles(c, 5, '#d4af37');
            if (this.crownsLeft <= 0) {
                this.game.showVictory(
                    'Labyrinth Cleared!',
                    'You have gathered all the crowns. The path to the palace lies ahead.',
                    '🏰'
                );
            }
        } else if (t === 3) {
            this.map[this.player.y][this.player.x] = 0;
            this.game.potionBoost = true;
            this.game.addScore(50);
            this._spawnParticles(c, 8, '#800080');
            this.game.showBanner('🧪 Witch Potion! Dagger Damage +50% in Act II!', 3000);
        }
    }

    _moveGuard(g) {
        const px = this.player.x, py = this.player.y;
        const dx = px - g.x, dy = py - g.y;
        let mx = 0, my = 0;
        // Simple greedy pathfinding
        if (Math.abs(dx) >= Math.abs(dy)) mx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
        else my = dy > 0 ? 1 : dy < 0 ? -1 : 0;

        if (this._walkable(g.x + mx, g.y + my)) {
            g.x += mx; g.y += my;
        } else {
            const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            const valid = dirs.filter(d => this._walkable(g.x+d.x, g.y+d.y));
            if (valid.length > 0) {
                const pick = valid[Math.floor(Math.random() * valid.length)];
                g.x += pick.x; g.y += pick.y;
            }
        }
    }

    _tileCenter(tx, ty) {
        return { x: this.offX + tx * this.tileS + this.tileS/2,
                 y: this.offY + ty * this.tileS + this.tileS/2 };
    }

    _spawnParticles(pos, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: pos.x, y: pos.y,
                vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
                size: Math.random()*4+2, color,
                alpha: 1, decay: 0.025 + Math.random()*0.02
            });
        }
    }

    _drawSprite(ctx, img, x, y, w, h, fallbackColor, fallbackDraw) {
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x, y, w, h);
        } else {
            fallbackDraw();
        }
    }

    _drawCrownFB(ctx, px, py, ts) {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(px+ts*.2, py+ts*.7); ctx.lineTo(px+ts*.2, py+ts*.35);
        ctx.lineTo(px+ts*.35,py+ts*.5); ctx.lineTo(px+ts*.5, py+ts*.3);
        ctx.lineTo(px+ts*.65,py+ts*.5); ctx.lineTo(px+ts*.8, py+ts*.35);
        ctx.lineTo(px+ts*.8, py+ts*.7); ctx.closePath(); ctx.fill();
    }

    _drawPotionFB(ctx, px, py, ts) {
        ctx.fillStyle = '#800080';
        ctx.beginPath(); ctx.arc(px+ts*.5, py+ts*.6, ts*.25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(px+ts*.42, py+ts*.25, ts*.16, ts*.25);
        ctx.fillRect(px+ts*.35, py+ts*.22, ts*.3, ts*.08);
    }
}

GAME.registerAct(1, new Act1());
