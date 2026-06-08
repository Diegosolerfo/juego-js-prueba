/**
 * act5.js — Act V: The Final Battle
 * 2D side-scrolling fighter: Malcolm (player, left) vs Macbeth (boss, right).
 * Malcolm: 100 HP. Light attack (🗡️) 15 dmg, Hold ≥0.5s for Heavy 30 dmg, Special (⚡) 50 dmg.
 * Macbeth: 500 HP. Throws rocks (20 dmg), daggers (30 dmg), charges with special (40 dmg).
 */

class Act5 {
    init(game) {
        this.game = game;
        this.W = game.canvas.width;
        this.H = game.canvas.height;
        game.maxHP   = 100;
        game.playerHP = 100;
        this._reset();

        // Track action hold time for heavy attack
        this._actionHoldTime  = 0;
        this._prevAction  = false;
        this._prevSpecial = false;
        this._specialCooldown = 0;
    }

    _reset() {
        const W = this.W, H = this.H;
        const floorY = H * 0.78;

        // Malcolm (player)
        this.malcolm = {
            x: W * 0.12, y: floorY,
            w: 44, h: 70,
            state: 'idle',   // idle | attack | heavy | special | hurt | dead
            stateTimer: 0,
            invTimer: 0,
            facing: 1,       // +1 = right
        };

        // Macbeth (boss, 500 HP)
        this.macbeth = {
            x: W * 0.82, y: floorY,
            w: 50, h: 78,
            hp: 500, maxHp: 500,
            state: 'idle',
            stateTimer: 0,
            attackTimer: 2.0,
            invTimer: 0,
            facing: -1,
        };

        this.floorY       = floorY;
        this.projectiles  = [];   // { x, y, vx, vy, dmg, owner, type }
        this.particles    = [];
        this.bgScroll     = 0;
        this.time         = 0;
        this.gameEnded    = false;

        this._specialCooldown = 0;
        this._actionHoldTime  = 0;
        this._prevAction  = false;
        this._prevSpecial = false;
    }

    cleanup() {}

    onResize(w, h) {
        this.W = w; this.H = h;
        this.floorY = h * 0.78;
    }

    update(dt, keys) {
        if (this.gameEnded) return;
        this.time += dt;
        this.bgScroll += dt * 30;

        const M = this.malcolm, B = this.macbeth;

        // ── Special button cooldown ───────────────────────────
        this._specialCooldown = Math.max(0, this._specialCooldown - dt);

        // ── Malcolm: state machine ────────────────────────────
        if (M.state !== 'dead') {
            M.stateTimer = Math.max(0, M.stateTimer - dt);
            if (M.invTimer > 0) M.invTimer -= dt;

            if (M.state !== 'idle' && M.stateTimer <= 0) M.state = 'idle';

            if (M.state === 'idle') {
                // Movement (left/right, stay in left half)
                if (keys.left  && M.x > this.W * 0.02) M.x -= 180 * dt;
                if (keys.right && M.x < this.W * 0.52) M.x += 180 * dt;

                // Light / Heavy attack
                if (keys.action) {
                    this._actionHoldTime += dt;
                } else if (this._prevAction && !keys.action) {
                    if (this._actionHoldTime >= 0.5) {
                        // Heavy attack
                        M.state = 'heavy'; M.stateTimer = 0.45;
                        this._malcolmHeavyAttack();
                    } else if (this._actionHoldTime > 0.02) {
                        // Light attack
                        M.state = 'attack'; M.stateTimer = 0.28;
                        this._malcolmLightAttack();
                    }
                    this._actionHoldTime = 0;
                }

                // Special
                if (keys.special && !this._prevSpecial && this._specialCooldown <= 0) {
                    M.state = 'special'; M.stateTimer = 0.55;
                    this._specialCooldown = 30;
                    this._malcolmSpecial();
                    this.game.showBanner('⚡ SPECIAL ATTACK!', 1200);
                }
            }
            this._prevAction  = keys.action;
            this._prevSpecial = keys.special;
            M.facing = B.x > M.x ? 1 : -1;
        }

        // ── Macbeth AI ────────────────────────────────────────
        if (B.state !== 'dead') {
            B.stateTimer = Math.max(0, B.stateTimer - dt);
            if (B.invTimer > 0) B.invTimer -= dt;
            if (B.state !== 'idle' && B.stateTimer <= 0) B.state = 'idle';

            B.attackTimer -= dt;
            if (B.attackTimer <= 0 && B.state === 'idle') {
                this._macbethAttack();
            }

            // Boss walks toward Malcolm slowly
            const bDir = M.x > B.x ? 1 : -1;
            if (Math.abs(M.x - B.x) > this.W * 0.25 && B.state === 'idle') {
                B.x += bDir * 40 * dt;
            }
            B.facing = M.x > B.x ? 1 : -1;
        }

        // ── Projectiles ───────────────────────────────────────
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.vy !== 0) p.vy += 400 * dt; // gravity for rocks
            if (p.x < -50 || p.x > this.W+50 || p.y > this.floorY + 50) {
                this.projectiles.splice(i, 1); continue;
            }

            // Hit detection
            if (p.owner === 'macbeth' && M.state !== 'dead' && M.invTimer <= 0) {
                if (Math.abs(p.x - (M.x + M.w/2)) < M.w/2+12 &&
                    Math.abs(p.y - (M.y - M.h/2)) < M.h/2+12) {
                    this._hitMalcolm(p.dmg);
                    this.projectiles.splice(i, 1); continue;
                }
            }

            if (p.owner === 'malcolm' && B.state !== 'dead' && B.invTimer <= 0) {
                if (Math.abs(p.x - (B.x + B.w/2)) < B.w/2+14 &&
                    Math.abs(p.y - (B.y - B.h/2)) < B.h/2+14) {
                    this._hitMacbeth(p.dmg, p.x, p.y);
                    this.projectiles.splice(i, 1); continue;
                }
            }
        }

        // ── Melee hit detection for attacks ──────────────────
        // (When Malcolm is attacking and close enough)
        if ((M.state === 'attack' || M.state === 'heavy' || M.state === 'special') && B.state !== 'dead' && B.invTimer <= 0) {
            const dist = Math.abs((M.x + M.w/2) - (B.x + B.w/2));
            if (dist < M.w + B.w) {
                // Damage is set per attack initiation, handled there
            }
        }

        // ── Particles ────────────────────────────────────────
        this.particles = this.particles.filter(p2 => {
            p2.x += p2.vx; p2.y += p2.vy; p2.alpha -= p2.decay; return p2.alpha > 0;
        });
    }

    draw(ctx, W, H) {
        const floorY = this.floorY;

        // ── Background: Dunsinane battlements ────────────────
        const sky = ctx.createLinearGradient(0,0,0,H*0.65);
        sky.addColorStop(0,'#04060a'); sky.addColorStop(1,'#1a0a0a');
        ctx.fillStyle = sky; ctx.fillRect(0,0,W,H*0.65);

        // Moon
        ctx.fillStyle = 'rgba(220,210,180,0.8)';
        ctx.beginPath(); ctx.arc(W*0.85, H*0.1, H*0.055, 0, Math.PI*2); ctx.fill();

        // Castle battlements scrolling
        ctx.fillStyle = '#1a1410';
        const bW = 60, bH = 50;
        for (let b = -1; b < Math.ceil(W/bW)+1; b++) {
            const bx = (b*bW - this.bgScroll*0.3) % (W+bW*2) - bW;
            ctx.fillRect(bx, H*0.32, bW*0.55, bH);
        }
        ctx.fillRect(0, H*0.32+bH, W, H*0.65-bH-H*0.32);

        // Ground (cobblestone)
        ctx.fillStyle = '#291a10';
        ctx.fillRect(0, floorY, W, H - floorY);
        ctx.strokeStyle = '#3d2510'; ctx.lineWidth = 2;
        for (let c = 0; c < W; c += 44) {
            ctx.strokeRect(c - (this.bgScroll*0.8%44), floorY, 44, 18);
            ctx.strokeRect(c + 22 - (this.bgScroll*0.8%44), floorY+18, 44, 18);
        }

        // ── Projectiles ───────────────────────────────────────
        this.projectiles.forEach(p => {
            if (p.type === 'rock') {
                ctx.fillStyle = '#7d7060';
                ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 8, p.x*0.01, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'dagger') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = p.owner === 'malcolm' ? '#d4af37' : '#c0c0c0';
                ctx.fillRect(-14, -3, 28, 6);
                ctx.restore();
            } else if (p.type === 'special') {
                const sg = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 20);
                sg.addColorStop(0,'rgba(150,100,255,1)'); sg.addColorStop(1,'rgba(0,0,0,0)');
                ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI*2); ctx.fill();
            }
        });

        // ── Particles ────────────────────────────────────────
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // ── Malcolm ───────────────────────────────────────────
        const M = this.malcolm;
        const mFlash = M.invTimer > 0 && Math.floor(M.invTimer*8)%2===0;
        if (!mFlash && M.state !== 'dead') {
            this._drawMalcolm(ctx, M, floorY);
        }

        // ── Macbeth (Boss) ────────────────────────────────────
        const B = this.macbeth;
        const bFlash = B.invTimer > 0 && Math.floor(B.invTimer*8)%2===0;
        if (!bFlash) {
            this._drawMacbeth(ctx, B, floorY);
        }

        // ── HP Bars (in-canvas) ───────────────────────────────
        // Malcolm
        ctx.fillStyle = 'rgba(11,8,6,0.7)';
        ctx.fillRect(10, 8, 160, 28);
        ctx.fillStyle = '#d4af37'; ctx.font = 'bold 10px Cinzel'; ctx.textAlign = 'left';
        ctx.fillText('MALCOLM', 14, 20);
        this._drawHPBar(ctx, 14, 22, 148, 8, this.game.playerHP/this.game.maxHP, '#2ecc71');

        // Macbeth boss bar
        ctx.fillStyle = 'rgba(11,8,6,0.7)';
        ctx.fillRect(W-170, 8, 160, 28);
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 10px Cinzel'; ctx.textAlign = 'right';
        ctx.fillText('MACBETH', W-14, 20);
        this._drawHPBar(ctx, W-162, 22, 148, 8, B.hp/B.maxHp, '#e74c3c');

        // Special cooldown indicator
        if (this._specialCooldown > 0) {
            const pct = 1 - this._specialCooldown / 30;
            ctx.fillStyle = 'rgba(11,8,6,0.7)'; ctx.fillRect(10, 42, 80, 14);
            ctx.fillStyle = '#7b8fff'; ctx.fillRect(12, 44, 76*pct, 10);
            ctx.fillStyle = '#7b8fff'; ctx.font = '8px Cinzel'; ctx.textAlign = 'left';
            ctx.fillText('⚡ SPECIAL', 14, 53);
        } else {
            ctx.fillStyle = '#7b8fff'; ctx.font = '9px Cinzel'; ctx.textAlign = 'left';
            ctx.fillText('⚡ READY', 14, 55);
        }

        // Attack charge indicator (hold for heavy)
        if (this._actionHoldTime > 0) {
            const chargePct = Math.min(1, this._actionHoldTime / 0.5);
            ctx.fillStyle = 'rgba(11,8,6,0.7)'; ctx.fillRect(10, 60, 80, 8);
            ctx.fillStyle = `hsl(${60-60*chargePct},100%,50%)`;
            ctx.fillRect(12, 62, 76*chargePct, 4);
        }
    }

    // ── Malcolm attacks ───────────────────────────────────────

    _malcolmLightAttack() {
        const M = this.malcolm, B = this.macbeth;
        const dist = Math.abs((M.x+M.w/2)-(B.x+B.w/2));
        if (dist < M.w + B.w + 40) {
            // Melee
            this._hitMacbeth(15, M.x + M.w, M.y - M.h*0.4);
        } else {
            // Throw dagger
            const vx = B.x > M.x ? 420 : -420;
            this.projectiles.push({ x: M.x+M.w, y: M.y-M.h*0.4, vx, vy: -20, dmg: 15, owner:'malcolm', type:'dagger' });
        }
    }

    _malcolmHeavyAttack() {
        const M = this.malcolm, B = this.macbeth;
        const dist = Math.abs((M.x+M.w/2)-(B.x+B.w/2));
        this._spawnParticles(M.x+M.w, M.y-M.h*0.4, 8, '#d4af37');
        if (dist < M.w + B.w + 60) {
            this._hitMacbeth(30, M.x + M.w, M.y - M.h*0.4);
        } else {
            const vx = B.x > M.x ? 380 : -380;
            this.projectiles.push({ x: M.x+M.w, y: M.y-M.h*0.5, vx, vy: -60, dmg: 30, owner:'malcolm', type:'dagger' });
            this.projectiles.push({ x: M.x+M.w, y: M.y-M.h*0.5, vx, vy: -20, dmg: 30, owner:'malcolm', type:'dagger' });
        }
    }

    _malcolmSpecial() {
        const M = this.malcolm;
        // Triple fast daggers + AoE burst
        for (let i = 0; i < 3; i++) {
            const vx = this.macbeth.x > M.x ? 500 : -500;
            this.projectiles.push({ x: M.x+M.w, y: M.y-M.h*(0.3+i*0.15), vx, vy: (i-1)*30, dmg: 50, owner:'malcolm', type:'special' });
        }
        this._spawnParticles(M.x+M.w/2, M.y-M.h/2, 20, '#7b8fff');
        this._hitMacbeth(50, M.x, M.y-M.h*0.5);
    }

    // ── Macbeth AI attacks ────────────────────────────────────

    _macbethAttack() {
        const B = this.macbeth, M = this.malcolm;
        const roll = Math.random();
        const hpPct = B.hp / B.maxHp;

        if (roll < 0.4 || hpPct < 0.3) {
            // Charge / special (40 dmg) — more frequent at low HP
            B.state = 'special'; B.stateTimer = 0.6;
            B.attackTimer = 3.0 + Math.random()*1.5;
            // Rush projectile
            const vx = M.x > B.x ? -600 : 600;
            this.projectiles.push({ x: B.x, y: B.y-B.h*0.4, vx, vy: 0, dmg: 40, owner:'macbeth', type:'special' });
            this._spawnParticles(B.x, B.y-B.h*0.5, 10, '#ff4444');
        } else if (roll < 0.7) {
            // Throw daggers (30 dmg)
            B.state = 'attack'; B.stateTimer = 0.35;
            B.attackTimer = 2.0 + Math.random()*1.5;
            const ang = Math.atan2(M.y-B.h*0.4 - (B.y-B.h*0.4), M.x - B.x);
            const spd = 360;
            this.projectiles.push({ x:B.x, y:B.y-B.h*0.4, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, dmg:30, owner:'macbeth', type:'dagger' });
        } else {
            // Throw rock (20 dmg, arcs)
            B.state = 'attack'; B.stateTimer = 0.4;
            B.attackTimer = 1.8 + Math.random()*1.5;
            const vx = M.x > B.x ? -300 : 300;
            this.projectiles.push({ x:B.x, y:B.y-B.h*0.7, vx, vy:-320, dmg:20, owner:'macbeth', type:'rock' });
        }
    }

    // ── Hit handlers ──────────────────────────────────────────

    _hitMalcolm(dmg) {
        const M = this.malcolm;
        M.state = 'hurt'; M.stateTimer = 0.25; M.invTimer = 0.8;
        this._spawnParticles(M.x+M.w/2, M.y-M.h/2, 8, '#ff4444');
        if (this.game.damagePlayer(dmg)) {
            M.state = 'dead';
            this.gameEnded = true;
        } else {
            this.game.showBanner(`Macbeth hits you! −${dmg} HP`);
        }
    }

    _hitMacbeth(dmg, px, py) {
        const B = this.macbeth;
        if (B.state === 'dead') return;
        B.invTimer = 0.25;
        B.hp = Math.max(0, B.hp - dmg);
        this._spawnParticles(px, py, 6, '#8b1e1e');
        if (B.hp <= 0) {
            B.state = 'dead';
            this.gameEnded = true;
            this._spawnParticles(B.x+B.w/2, B.y-B.h/2, 30, '#d4af37');
            setTimeout(() => {
                this.game.showVictory(
                    '"This dead butcher..."',
                    'Macbeth has fallen. Malcolm claims the throne of Scotland. The tyranny is over.',
                    '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
                );
            }, 1200);
        }
    }

    // ── Drawing ───────────────────────────────────────────────

    _drawMalcolm(ctx, M, floorY) {
        const x = M.x, y = floorY, w = M.w, h = M.h;
        const isAttacking = M.state === 'attack' || M.state === 'heavy' || M.state === 'special';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(x+w/2, floorY+4, w/2, 6, 0, 0, Math.PI*2); ctx.fill();

        // Blue/grey armor (Malcolm is a noble warrior)
        ctx.fillStyle = '#1a3a6c';
        ctx.fillRect(x+w*0.15, y-h*0.75, w*0.7, h*0.55);
        // Head
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath(); ctx.arc(x+w*0.5, y-h*0.82, w*0.28, 0, Math.PI*2); ctx.fill();
        // Helmet
        ctx.fillStyle = '#4a7ab5';
        ctx.beginPath(); ctx.arc(x+w*0.5, y-h*0.87, w*0.3, Math.PI, 0); ctx.fill();
        ctx.fillRect(x+w*0.35, y-h*0.82, w*0.3, w*0.08);
        // Legs
        ctx.fillStyle = '#2a4a80';
        ctx.fillRect(x+w*0.18, y-h*0.2, w*0.28, h*0.22);
        ctx.fillRect(x+w*0.54, y-h*0.2, w*0.28, h*0.22);
        // Attack anim: sword arm extended
        ctx.strokeStyle = '#4a7ab5'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        if (isAttacking) {
            const armX = M.facing > 0 ? x+w : x;
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(armX + M.facing*25, y-h*0.5); ctx.stroke();
            // Sword
            ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(armX+M.facing*25, y-h*0.5); ctx.lineTo(armX+M.facing*55, y-h*0.38); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(x+w*0.2, y-h*0.4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(x+w*0.8, y-h*0.4); ctx.stroke();
        }
    }

    _drawMacbeth(ctx, B, floorY) {
        const x = B.x, y = floorY, w = B.w, h = B.h;
        const isAttacking = B.state === 'attack' || B.state === 'special';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x+w/2, floorY+5, w/2+4, 7, 0, 0, Math.PI*2); ctx.fill();

        // Dark armor (boss)
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(x+w*0.1, y-h*0.75, w*0.8, h*0.58);
        // Spikes on shoulders
        ctx.fillStyle = '#5c3a1a';
        ctx.beginPath(); ctx.moveTo(x, y-h*0.68); ctx.lineTo(x-8, y-h*0.82); ctx.lineTo(x+w*0.18, y-h*0.68); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+w, y-h*0.68); ctx.lineTo(x+w+8, y-h*0.82); ctx.lineTo(x+w*0.82, y-h*0.68); ctx.closePath(); ctx.fill();
        // Head
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath(); ctx.arc(x+w*0.5, y-h*0.84, w*0.3, 0, Math.PI*2); ctx.fill();
        // Crown (tyrannical)
        const crownGlow = ctx.createRadialGradient(x+w*0.5, y-h*0.96, 2, x+w*0.5, y-h*0.96, 20);
        crownGlow.addColorStop(0, 'rgba(212,175,55,0.6)'); crownGlow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = crownGlow;
        ctx.beginPath(); ctx.arc(x+w*0.5, y-h*0.96, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(x+w*0.2, y-h*0.9); ctx.lineTo(x+w*0.28, y-h+4); ctx.lineTo(x+w*0.5, y-h*0.93);
        ctx.lineTo(x+w*0.72, y-h+4); ctx.lineTo(x+w*0.8, y-h*0.9); ctx.closePath(); ctx.fill();
        // Legs
        ctx.fillStyle = '#1a0f0a';
        ctx.fillRect(x+w*0.15, y-h*0.2, w*0.3, h*0.22);
        ctx.fillRect(x+w*0.55, y-h*0.2, w*0.3, h*0.22);
        // Attack anim: swing arm
        ctx.strokeStyle = '#5c3a1a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        if (isAttacking) {
            const armX = B.facing > 0 ? x+w : x;
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(armX+B.facing*20, y-h*0.5); ctx.stroke();
            ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(armX+B.facing*20, y-h*0.5); ctx.lineTo(armX+B.facing*50, y-h*0.35); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(x+w*0.15, y-h*0.4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x+w*0.5, y-h*0.6); ctx.lineTo(x+w*0.85, y-h*0.4); ctx.stroke();
        }

        // Boss HP label
        ctx.fillStyle = '#ff4444'; ctx.font = `bold ${Math.max(9,this.H*0.018)}px Cinzel`;
        ctx.textAlign = 'center';
        ctx.fillText(`${B.hp} HP`, x+w/2, y-h-14);
    }

    _drawHPBar(ctx, x, y, w, h, pct, color) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x-1, y-1, w+2, h+2);
        ctx.fillStyle = '#3a1010'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color; ctx.fillRect(x, y, w*Math.max(0,pct), h);
    }

    _spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y, vx:(Math.random()-0.5)*7, vy:(Math.random()-0.5)*7,
                size:Math.random()*5+2, color, alpha:1, decay:0.025+Math.random()*0.025
            });
        }
    }
}

GAME.registerAct(5, new Act5());
