/**
 * act2.js — Act II: The Assassination
 * Top-down combat room. Player moves freely, throws daggers.
 * Wave-based enemy spawning. Kill all 10 guards, then slay King Duncan.
 */

class Act2 {
    init(game) {
        this.game = game;
        this.W = game.canvas.width;
        this.H = game.canvas.height;
        this._reset();

        this.imgPlayer = new Image(); this.imgPlayer.src = 'assets/macbeth_sprite.png';
        this.imgDagger = new Image(); this.imgDagger.src = 'assets/dagger_sprite.png';
        this.imgCrown  = new Image(); this.imgCrown.src  = 'assets/crown_point.png';
        this.imgBlood  = new Image(); this.imgBlood.src  = 'assets/blood_stain.png';

        // Wire action button for shooting
        this._prevAction = false;
    }

    _reset() {
        const W = this.W, H = this.H;
        // Player is a free-moving entity in screen coords
        this.player = {
            x: W * 0.5, y: H * 0.65,
            speed: 180, // px/s
            dir: { x: 1, y: 0 },
            invTimer: 0,
            shooting: false,
            shootCooldown: 0
        };

        // Background scroll
        this.bgX = 0; this.bgY = 0;
        this.tileSize = 64;

        // Guards & projectiles
        this.guards   = [];
        this.daggers  = [];
        this.particles= [];
        this.bloodStains = [];

        // Wave management
        this.wave         = 0;
        this.guardsToKill = 10;
        this.guardsKilled = 0;
        this.waveGuardsLeft = 0;
        this.wavePause    = 0;   // countdown before next wave
        this.spawnedTotal = 0;
        this.kingSpawned  = false;
        this.king         = null;

        this._spawnWave();
    }

    _spawnWave() {
        this.wave++;
        // 3 guards per wave, up to 10 total
        const count = Math.min(3, this.guardsToKill - this.spawnedTotal);
        if (count <= 0) return;
        const W = this.W, H = this.H;
        for (let i = 0; i < count; i++) {
            const side  = Math.floor(Math.random() * 4);
            let gx, gy;
            if (side === 0) { gx = Math.random()*W; gy = -40; }
            else if (side === 1) { gx = W+40; gy = Math.random()*H; }
            else if (side === 2) { gx = Math.random()*W; gy = H+40; }
            else { gx = -40; gy = Math.random()*H; }

            const maxHp = Math.floor(Math.random() * 121) + 80;
            this.guards.push({
                x: gx, y: gy,
                hp: maxHp, maxHp,
                speed: 80 + Math.random()*40,
                size: 32,
                shootTimer: 2 + Math.random()*2,
                invTimer: 0,
            });
            this.spawnedTotal++;
        }
        this.waveGuardsLeft = count;
    }

    cleanup() {}

    onResize(w, h) { this.W = w; this.H = h; }

    update(dt, keys) {
        const p = this.player;
        const W = this.W, H = this.H;

        // ── Player movement ───────────────────────────────────
        let dx = 0, dy = 0;
        if (keys.left)  dx -= 1;
        if (keys.right) dx += 1;
        if (keys.up)    dy -= 1;
        if (keys.down)  dy += 1;
        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len; dy /= len;
            p.dir.x = dx; p.dir.y = dy;
        }
        p.x = Math.max(16, Math.min(W-16, p.x + dx * p.speed * dt));
        p.y = Math.max(16, Math.min(H-16, p.y + dy * p.speed * dt));

        // Scroll background opposite to player movement
        this.bgX = (this.bgX - dx * p.speed * dt * 0.4 + 1000) % this.tileSize;
        this.bgY = (this.bgY - dy * p.speed * dt * 0.4 + 1000) % this.tileSize;

        // ── Shooting ─────────────────────────────────────────
        p.shootCooldown = Math.max(0, p.shootCooldown - dt);
        if (keys.action && !this._prevAction && p.shootCooldown <= 0) {
            this._fireDagger();
            p.shootCooldown = 0.28;
        }
        this._prevAction = keys.action;

        // ── Invincibility ────────────────────────────────────
        if (p.invTimer > 0) p.invTimer -= dt;

        // ── Daggers ──────────────────────────────────────────
        const dmg = this.game.potionBoost ? 45 : 30;
        for (let i = this.daggers.length - 1; i >= 0; i--) {
            const d = this.daggers[i];
            d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
            if (d.life <= 0 || d.x < -20 || d.x > W+20 || d.y < -20 || d.y > H+20) {
                this.daggers.splice(i, 1); continue;
            }
            // Hit guards
            for (let j = this.guards.length - 1; j >= 0; j--) {
                const g = this.guards[j];
                if (Math.hypot(d.x - g.x, d.y - g.y) < g.size) {
                    g.hp -= dmg;
                    this._spawnParticles(g.x, g.y, 6, '#8b1e1e');
                    this.daggers.splice(i, 1);
                    if (g.hp <= 0) {
                        this._spawnParticles(g.x, g.y, 12, '#8b1e1e');
                        this.bloodStains.push({ x: g.x, y: g.y });
                        this.guards.splice(j, 1);
                        this.guardsKilled++;
                        this.game.addScore(150);
                        this.waveGuardsLeft--;
                        // Next wave or king
                        if (this.guardsKilled >= this.guardsToKill && !this.kingSpawned) {
                            this._spawnKing();
                        } else if (this.waveGuardsLeft <= 0 && !this.kingSpawned) {
                            this.wavePause = 1.5;
                        }
                    }
                    break;
                }
            }
        }

        // ── Wave timer ───────────────────────────────────────
        if (this.wavePause > 0) {
            this.wavePause -= dt;
            if (this.wavePause <= 0 && this.spawnedTotal < this.guardsToKill) {
                this._spawnWave();
            }
        }

        // ── Guards movement & attack ──────────────────────────
        this.guards.forEach(g => {
            if (g.invTimer > 0) { g.invTimer -= dt; return; }
            const gdx = p.x - g.x, gdy = p.y - g.y;
            const len = Math.hypot(gdx, gdy);
            g.x += (gdx/len) * g.speed * dt;
            g.y += (gdy/len) * g.speed * dt;

            // Guard collision with player
            if (len < g.size + 16 && p.invTimer <= 0) {
                if (!this.game.damagePlayer(20)) {
                    p.invTimer = 1.2;
                    this._spawnParticles(p.x, p.y, 8, '#ff4444');
                    this.game.showBanner('Guard hit you! −20 HP');
                }
            }

            // Guard shoots at player
            g.shootTimer -= dt;
            if (g.shootTimer <= 0) {
                g.shootTimer = 2.5 + Math.random()*2;
                const ang = Math.atan2(p.y - g.y, p.x - g.x);
                this.daggers.push({ x: g.x, y: g.y, vx: Math.cos(ang)*200, vy: Math.sin(ang)*200, life: 3, fromGuard: true });
            }
        });

        // ── Guard daggers hit player ──────────────────────────
        for (let i = this.daggers.length - 1; i >= 0; i--) {
            const d = this.daggers[i];
            if (!d.fromGuard) continue;
            if (Math.hypot(d.x - p.x, d.y - p.y) < 18 && p.invTimer <= 0) {
                this.daggers.splice(i, 1);
                if (!this.game.damagePlayer(15)) {
                    p.invTimer = 1.0;
                    this._spawnParticles(p.x, p.y, 6, '#ff4444');
                }
            }
        }

        // ── King Duncan ───────────────────────────────────────
        if (this.king) {
            const kd = this.king;
            const kdx = p.x - kd.x, kdy = p.y - kd.y;
            const klen = Math.hypot(kdx, kdy);
            kd.x += (kdx/klen) * kd.speed * dt;
            kd.y += (kdy/klen) * kd.speed * dt;

            // King hit by player daggers
            for (let i = this.daggers.length - 1; i >= 0; i--) {
                const d = this.daggers[i];
                if (d.fromGuard) continue;
                if (Math.hypot(d.x - kd.x, d.y - kd.y) < kd.size) {
                    this.daggers.splice(i, 1);
                    kd.hp -= dmg;
                    this._spawnParticles(kd.x, kd.y, 8, '#d4af37');
                    if (kd.hp <= 0) {
                        this._spawnParticles(kd.x, kd.y, 25, '#d4af37');
                        this.king = null;
                        this.game.addScore(1000);
                        this.game.showVictory(
                            '"I have done the deed..."',
                            'King Duncan is slain. Macbeth seizes the crown. Scotland trembles.',
                            '👑'
                        );
                        return;
                    }
                }
            }
        }

        // ── Particles ────────────────────────────────────────
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
            return p.alpha > 0;
        });
    }

    draw(ctx, W, H) {
        // ── Scrolling stone-floor background ─────────────────
        const ts = this.tileSize;
        ctx.fillStyle = '#1e130c';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#2d1e15'; ctx.lineWidth = 1;
        for (let row = -1; row < Math.ceil(H/ts)+1; row++) {
            for (let col = -1; col < Math.ceil(W/ts)+1; col++) {
                const x = (col * ts + this.bgX) % (W + ts) - ts;
                const y = (row * ts + this.bgY) % (H + ts) - ts;
                ctx.strokeRect(x, y, ts, ts);
            }
        }

        // ── Blood stains ──────────────────────────────────────
        this.bloodStains.forEach(s => {
            if (this.imgBlood.complete && this.imgBlood.naturalWidth > 0) {
                ctx.globalAlpha = 0.5;
                ctx.drawImage(this.imgBlood, s.x-20, s.y-20, 40, 40);
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = 'rgba(100,0,0,0.4)';
                ctx.beginPath(); ctx.ellipse(s.x, s.y, 15, 10, 0, 0, Math.PI*2); ctx.fill();
            }
        });

        // ── Enemy daggers (red tint) ─────────────────────────
        this.daggers.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(Math.atan2(d.vy, d.vx));
            ctx.fillStyle = d.fromGuard ? '#ff4444' : '#ede4c9';
            ctx.fillRect(-12, -3, 24, 6);
            ctx.restore();
        });

        // ── Particles ────────────────────────────────────────
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // ── Guards ───────────────────────────────────────────
        this.guards.forEach(g => {
            // Body
            ctx.fillStyle = '#78909c';
            ctx.beginPath(); ctx.arc(g.x, g.y, g.size, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#b0bec5';
            ctx.beginPath(); ctx.arc(g.x, g.y - g.size*0.55, g.size*0.4, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#8b1e1e';
            ctx.fillRect(g.x - g.size*0.2, g.y - g.size*0.3, g.size*0.4, g.size*0.5);
            // HP bar
            this._drawHPBar(ctx, g.x - 24, g.y - g.size - 12, 48, 5, g.hp/g.maxHp);
        });

        // ── King Duncan ───────────────────────────────────────
        if (this.king) {
            const kd = this.king;
            // Royal glow
            const grd = ctx.createRadialGradient(kd.x, kd.y, 4, kd.x, kd.y, kd.size+16);
            grd.addColorStop(0, 'rgba(212,175,55,0.4)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(kd.x, kd.y, kd.size+16, 0, Math.PI*2); ctx.fill();
            // Body
            ctx.fillStyle = '#6a1b9a';
            ctx.beginPath(); ctx.arc(kd.x, kd.y, kd.size, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffe0b2';
            ctx.beginPath(); ctx.arc(kd.x, kd.y - kd.size*0.6, kd.size*0.35, 0, Math.PI*2); ctx.fill();
            // Crown
            ctx.fillStyle = '#d4af37';
            const kcx = kd.x, kcy = kd.y - kd.size - 4;
            ctx.beginPath();
            ctx.moveTo(kcx-12, kcy); ctx.lineTo(kcx-8, kcy-10);
            ctx.lineTo(kcx, kcy-5); ctx.lineTo(kcx+8, kcy-10);
            ctx.lineTo(kcx+12, kcy); ctx.closePath(); ctx.fill();
            // HP (1 HP bar)
            this._drawHPBar(ctx, kd.x-30, kd.y - kd.size - 20, 60, 7, kd.hp/kd.maxHp, '#ffd700');
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 10px Cinzel';
            ctx.textAlign = 'center';
            ctx.fillText('KING DUNCAN', kd.x, kd.y - kd.size - 26);
        }

        // ── Player ───────────────────────────────────────────
        const p = this.player;
        const flash = p.invTimer > 0 && Math.floor(p.invTimer * 8) % 2 === 0;
        if (!flash) {
            if (this.imgPlayer.complete && this.imgPlayer.naturalWidth > 0) {
                ctx.drawImage(this.imgPlayer, p.x-20, p.y-24, 40, 48);
            } else {
                ctx.fillStyle = '#00e676';
                ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI*2); ctx.fill();
            }
        }

        // ── Wave / kill counter ───────────────────────────────
        ctx.fillStyle = 'rgba(11,8,6,0.6)';
        ctx.fillRect(W-140, 8, 132, 38);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 11px Cinzel'; ctx.textAlign = 'right';
        ctx.fillText(`Guards: ${this.guardsKilled}/${this.guardsToKill}`, W - 12, 24);
        const dmgLabel = this.game.potionBoost ? 'DMG: 45 ✦' : 'DMG: 30';
        ctx.fillStyle = this.game.potionBoost ? '#b36eff' : '#8b5a2b';
        ctx.font = 'bold 10px Cinzel';
        ctx.fillText(dmgLabel, W - 12, 40);
    }

    // ── Internals ────────────────────────────────────────────

    _fireDagger() {
        const p = this.player;
        const speed = 420;
        let vx = p.dir.x * speed, vy = p.dir.y * speed;
        if (vx === 0 && vy === 0) vx = speed; // default: right
        this.daggers.push({ x: p.x, y: p.y, vx, vy, life: 2.5, fromGuard: false });
    }

    _spawnKing() {
        this.kingSpawned = true;
        this.game.showBanner('⚠️ King Duncan appears! Slay him!', 3000);
        this.king = {
            x: this.W * 0.5, y: -50,
            hp: 1, maxHp: 1,
            speed: 55,
            size: 28
        };
    }

    _spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
                size: Math.random()*4+2, color, alpha: 1,
                decay: 0.02 + Math.random()*0.02
            });
        }
    }

    _drawHPBar(ctx, x, y, w, h, pct, color = '#2ecc71') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x-1, y-1, w+2, h+2);
        ctx.fillStyle = '#3a1010';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w*pct, h);
    }
}

GAME.registerAct(2, new Act2());
