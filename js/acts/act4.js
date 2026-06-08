/**
 * act4.js — Act IV: The Plea
 * Cinematic narrative act. No game loop, pure visual storytelling.
 * Sequential slides with parallax, painted canvas scenes, and text.
 * Any key / tap advances. After last slide, switches to Act V.
 */

class Act4 {
    init(game) {
        this.game = game;
        this.W = game.canvas.width;
        this.H = game.canvas.height;
        this.slideIndex  = 0;
        this.slideAlpha  = 0;
        this.fadeIn      = true;
        this.time        = 0;
        this.waitingNext = false;

        // Allow tap / any action to advance
        this._advanceBound = this._advance.bind(this);
        window.addEventListener('keydown', this._advanceBound);
        document.getElementById('gameCanvas').addEventListener('touchstart', this._advanceBound, { passive: true });
        document.getElementById('btnAction').addEventListener('click', this._advanceBound);

        // Show hint
        game.showBanner('Tap / press any key to continue ›', 3500);
    }

    cleanup() {
        window.removeEventListener('keydown', this._advanceBound);
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.removeEventListener('touchstart', this._advanceBound);
        const btn = document.getElementById('btnAction');
        if (btn) btn.removeEventListener('click', this._advanceBound);
    }

    onResize(w, h) { this.W = w; this.H = h; }

    _advance() {
        if (!this.waitingNext) return;
        this.slideIndex++;
        if (this.slideIndex >= this.slides.length) {
            this.cleanup();
            this.game.showVictory(
                'The Prophecies Converge...',
                'Malcolm\'s army approaches. The final confrontation cannot be avoided.',
                '📜'
            );
            return;
        }
        this.slideAlpha = 0;
        this.fadeIn = true;
        this.waitingNext = false;
    }

    update(dt, keys) {
        this.time += dt;
        if (this.fadeIn) {
            this.slideAlpha += dt * 1.2;
            if (this.slideAlpha >= 1) { this.slideAlpha = 1; this.fadeIn = false; this.waitingNext = true; }
        }
    }

    draw(ctx, W, H) {
        ctx.clearRect(0, 0, W, H);
        const slide = this.slides[this.slideIndex];
        if (!slide) return;

        // ── Draw the painted scene ────────────────────────────
        slide.paint(ctx, W, H, this.time);

        // ── Fade-in overlay ───────────────────────────────────
        if (this.slideAlpha < 1) {
            ctx.fillStyle = `rgba(0,0,0,${1 - this.slideAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }

        // ── Text panel at the bottom ──────────────────────────
        const panelH = Math.min(160, H * 0.32);
        const panelY = H - panelH;
        const panelGrd = ctx.createLinearGradient(0, panelY, 0, H);
        panelGrd.addColorStop(0, 'rgba(11,8,6,0)');
        panelGrd.addColorStop(0.25, 'rgba(11,8,6,0.92)');
        panelGrd.addColorStop(1, 'rgba(11,8,6,0.98)');
        ctx.fillStyle = panelGrd;
        ctx.fillRect(0, panelY, W, panelH);

        ctx.globalAlpha = this.slideAlpha;

        // Act number badge
        ctx.fillStyle = '#8b5a2b';
        ctx.font = `${Math.max(9, H*0.018)}px Cinzel`;
        ctx.textAlign = 'center';
        ctx.fillText(slide.badge, W/2, panelY + 22);

        // Title
        ctx.fillStyle = '#d4af37';
        ctx.font = `bold ${Math.max(13, H*0.03)}px Cinzel`;
        ctx.fillText(slide.title, W/2, panelY + 46);

        // Quote line
        ctx.fillStyle = '#ede4c9';
        ctx.font = `italic ${Math.max(10, H*0.022)}px Cinzel`;
        const wrapped = this._wrapText(slide.quote, W * 0.85);
        let lineY = panelY + 70;
        wrapped.forEach(line => { ctx.fillText(line, W/2, lineY); lineY += Math.max(14, H*0.027); });

        // Tap to continue hint
        if (this.waitingNext) {
            const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.5);
            ctx.globalAlpha = this.slideAlpha * (0.5 + 0.5 * pulse);
            ctx.fillStyle = '#8b5a2b';
            ctx.font = `${Math.max(9, H*0.018)}px Cinzel`;
            ctx.fillText('[ Tap to continue › ]', W/2, H - 12);
        }
        ctx.globalAlpha = 1;
    }

    // ── Slides ────────────────────────────────────────────────

    get slides() {
        return [
            {
                badge: 'Act IV · Scene I',
                title: 'The Coronation',
                quote: '"I have bought golden opinions from all sorts of people."',
                paint: (ctx, W, H, t) => {
                    // Dark throne room
                    this._drawThroneRoom(ctx, W, H, t);
                }
            },
            {
                badge: 'Act IV · Scene II',
                title: "Banquo's Ghost",
                quote: '"Thou canst not say I did it: never shake thy gory locks at me."',
                paint: (ctx, W, H, t) => {
                    this._drawBanquetGhost(ctx, W, H, t);
                }
            },
            {
                badge: 'Act IV · Scene III',
                title: "The Witches' Warning",
                quote: '"Double, double toil and trouble; Fire burn, and cauldron bubble."',
                paint: (ctx, W, H, t) => {
                    this._drawCauldron(ctx, W, H, t);
                }
            },
            {
                badge: 'Act IV · Scene IV',
                title: "Malcolm's March",
                quote: '"Let every soldier hew him down a bough and bear\'t before him."',
                paint: (ctx, W, H, t) => {
                    this._drawMarch(ctx, W, H, t);
                }
            },
        ];
    }

    // ── Scene painters ────────────────────────────────────────

    _drawThroneRoom(ctx, W, H, t) {
        // Stone wall
        ctx.fillStyle = '#1a1007';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#231812';
        for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) {
            if ((r+c)%2===0) ctx.fillRect(c*W/11, r*H/7, W/11, H/7);
        }
        // Throne (center)
        const tx = W/2, ty = H*0.42;
        ctx.fillStyle = '#8b6914'; ctx.fillRect(tx-55, ty-80, 110, 130);
        ctx.fillStyle = '#800000'; ctx.fillRect(tx-42, ty-65, 84, 90);
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(tx-55, ty+30, 12, 40); ctx.fillRect(tx+43, ty+30, 12, 40);
        // Macbeth on throne
        ctx.fillStyle = '#2c1e17';
        ctx.fillRect(tx-20, ty-50, 40, 80);
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath(); ctx.arc(tx, ty-65, 18, 0, Math.PI*2); ctx.fill();
        // Crown glow
        const cg = ctx.createRadialGradient(tx, ty-80, 2, tx, ty-80, 30);
        cg.addColorStop(0, 'rgba(212,175,55,0.7)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(tx, ty-80, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(tx-18, ty-82); ctx.lineTo(tx-10, ty-98); ctx.lineTo(tx, ty-88);
        ctx.lineTo(tx+10, ty-98); ctx.lineTo(tx+18, ty-82); ctx.closePath(); ctx.fill();
        // Candle torches parallax
        this._drawTorches(ctx, W, H, t);
    }

    _drawBanquetGhost(ctx, W, H, t) {
        ctx.fillStyle = '#0e0a06'; ctx.fillRect(0, 0, W, H);
        // Table
        ctx.fillStyle = '#422818';
        ctx.fillRect(W*0.1, H*0.55, W*0.8, H*0.12);
        ctx.strokeStyle = '#5e3820'; ctx.lineWidth = 3;
        ctx.strokeRect(W*0.1, H*0.55, W*0.8, H*0.12);
        // Candles
        for (let i = 0; i < 5; i++) {
            const cx = W*0.18 + i * W*0.165;
            ctx.fillStyle = '#d8cca3'; ctx.fillRect(cx-3, H*0.4, 6, H*0.15);
            const fg = ctx.createRadialGradient(cx, H*0.38, 1, cx, H*0.38, 14);
            fg.addColorStop(0, 'rgba(255,200,50,0.9)'); fg.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, H*0.38, 14, 0, Math.PI*2); ctx.fill();
        }
        // Ghost (green ethereal)
        const ghostAlpha = 0.5 + 0.3*Math.sin(t*2.5);
        ctx.globalAlpha = ghostAlpha;
        const gg = ctx.createRadialGradient(W/2, H*0.3, 8, W/2, H*0.3, 60);
        gg.addColorStop(0, 'rgba(100,230,140,0.8)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(W/2, H*0.3, 60, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#64e696';
        ctx.beginPath(); ctx.arc(W/2, H*0.25, 22, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W/2, H*0.36); ctx.lineTo(W/2, H*0.53);
        ctx.moveTo(W/2-22, H*0.42); ctx.lineTo(W/2+22, H*0.42); ctx.strokeStyle = '#32cd32'; ctx.lineWidth=5; ctx.stroke();
        ctx.globalAlpha = 1;
        // Macbeth pointing left in terror
        ctx.fillStyle = '#2c1e17';
        ctx.fillRect(W*0.15, H*0.4, 28, 60);
        ctx.fillStyle = '#ffe4c4'; ctx.beginPath(); ctx.arc(W*0.164, H*0.38, 14, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#2c1e17'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(W*0.164, H*0.43); ctx.lineTo(W*0.32, H*0.36); ctx.stroke();
    }

    _drawCauldron(ctx, W, H, t) {
        // Cave
        const cg = ctx.createRadialGradient(W/2, H, 10, W/2, H, W*0.8);
        cg.addColorStop(0, '#100c08'); cg.addColorStop(1, '#050304');
        ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
        // Rock formations
        ctx.fillStyle = '#221a17';
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,H*0.4); ctx.lineTo(W*0.15,H*0.6); ctx.lineTo(W*0.08,H); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W,H); ctx.lineTo(W,H*0.35); ctx.lineTo(W*0.85,H*0.55); ctx.lineTo(W*0.92,H); ctx.fill();
        // Cauldron glow
        const cGlow = ctx.createRadialGradient(W/2, H*0.68, 5, W/2, H*0.68, 90);
        cGlow.addColorStop(0, 'rgba(100,0,200,0.6)'); cGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cGlow; ctx.beginPath(); ctx.arc(W/2, H*0.68, 90, 0, Math.PI*2); ctx.fill();
        // Cauldron body
        ctx.fillStyle = '#1a1614'; ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(W/2, H*0.72, H*0.1, 0, Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(W/2-H*0.11, H*0.65, H*0.22, H*0.07);
        ctx.strokeRect(W/2-H*0.11, H*0.65, H*0.22, H*0.07);
        // Bubbling liquid
        ctx.fillStyle = `hsl(${280 + Math.sin(t*3)*20}, 80%, 40%)`;
        ctx.beginPath(); ctx.ellipse(W/2, H*0.65, H*0.09, H*0.022, 0, 0, Math.PI*2); ctx.fill();
        // Bubbles rising
        for (let b = 0; b < 6; b++) {
            const bx = W/2 + (b-3)*H*0.025;
            const by = H*0.65 - ((t*50*(b+1)*0.3)%80);
            const ba = Math.max(0, 1 - ((t*50*(b+1)*0.3)%80)/80);
            ctx.globalAlpha = ba;
            ctx.fillStyle = '#b060e0';
            ctx.beginPath(); ctx.arc(bx, by, 4+b, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Witches silhouettes
        for (let w2 = 0; w2 < 3; w2++) {
            const wx = W*(0.2 + w2*0.3);
            const wy = H*0.6 + Math.sin(t*2+w2)*8;
            ctx.fillStyle = '#0a0808';
            ctx.beginPath(); ctx.moveTo(wx, H*0.85); ctx.lineTo(wx-25, wy); ctx.lineTo(wx+25, wy); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.arc(wx, wy-15, 13, 0, Math.PI*2); ctx.fill();
        }
    }

    _drawMarch(ctx, W, H, t) {
        // Dawn sky
        const sky = ctx.createLinearGradient(0,0,0,H*0.6);
        sky.addColorStop(0,'#1a0a04'); sky.addColorStop(0.5,'#3d1a08'); sky.addColorStop(1,'#6b2d0a');
        ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
        // Ground
        ctx.fillStyle = '#1e2210'; ctx.fillRect(0,H*0.6,W,H*0.4);
        // Dunsinane castle silhouette (far right)
        ctx.fillStyle = '#120d08';
        ctx.fillRect(W*0.72,H*0.18,W*0.28,H*0.42);
        ctx.fillRect(W*0.74,H*0.08,W*0.07,H*0.12);
        ctx.fillRect(W*0.87,H*0.10,W*0.07,H*0.12);
        // Army of trees (soldiers holding branches) marching
        const armyScroll = (t * 40) % (W*0.7);
        for (let s = 0; s < 12; s++) {
            const sx = (-armyScroll + s * W*0.065 + W*0.28) % (W*0.9);
            const sy = H*0.6;
            const depth = 0.6 + (s%3)*0.1;
            this._drawSoldierTree(ctx, sx, sy, depth);
        }
        // Moon / sun
        ctx.fillStyle = '#ff6b1a';
        ctx.beginPath(); ctx.arc(W*0.15, H*0.15, H*0.06, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,107,26,0.2)';
        ctx.beginPath(); ctx.arc(W*0.15, H*0.15, H*0.1, 0, Math.PI*2); ctx.fill();
        this._drawTorches(ctx, W, H, t);
    }

    _drawSoldierTree(ctx, x, y, scale) {
        ctx.fillStyle = `rgba(13,27,8,${scale})`;
        ctx.beginPath(); ctx.moveTo(x,y-60*scale); ctx.lineTo(x-20*scale,y); ctx.lineTo(x+20*scale,y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x,y-80*scale); ctx.lineTo(x-14*scale,y-45*scale); ctx.lineTo(x+14*scale,y-45*scale); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(90,90,90,${scale*0.8})`;
        ctx.beginPath(); ctx.arc(x, y+6*scale, 8*scale, 0, Math.PI*2); ctx.fill();
    }

    _drawTorches(ctx, W, H, t) {
        const flicker = 0.8 + 0.2*Math.sin(t*12);
        [[W*0.08,H*0.3],[W*0.92,H*0.3],[W*0.18,H*0.55],[W*0.82,H*0.55]].forEach(([tx,ty]) => {
            ctx.fillStyle = '#5c3a1a'; ctx.fillRect(tx-4, ty, 8, 30);
            const fg = ctx.createRadialGradient(tx, ty, 1, tx, ty, 22*flicker);
            fg.addColorStop(0,'rgba(255,180,40,0.95)'); fg.addColorStop(1,'rgba(255,60,0,0)');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(tx, ty, 22*flicker, 0, Math.PI*2); ctx.fill();
        });
    }

    _wrapText(text, maxWidth) {
        // Estimate wrapping based on character count (approximate)
        const charsPerLine = Math.max(20, Math.floor(maxWidth / 8));
        const words = text.split(' ');
        const lines = [];
        let line = '';
        words.forEach(word => {
            if ((line + word).length > charsPerLine) { lines.push(line.trim()); line = word + ' '; }
            else line += word + ' ';
        });
        if (line.trim()) lines.push(line.trim());
        return lines;
    }
}

GAME.registerAct(4, new Act4());
