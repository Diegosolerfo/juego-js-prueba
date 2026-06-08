/**
 * game.js — ActController
 * Central state machine. Owns the canvas, input routing,
 * shared state, and HUD. Each act registers itself via
 * GAME.registerAct(n, actInstance).
 */

class ActController {
    constructor() {
        // Shared state
        this.currentAct   = 0;
        this.playerHP     = 100;
        this.maxHP        = 100;
        this.score        = 0;
        this.potionBoost  = false;   // Carried from Act I
        this.gameRunning  = false;

        // Act registry
        this._acts = {};

        // Canvas
        this.canvas  = document.getElementById('gameCanvas');
        this.ctx     = this.canvas.getContext('2d');
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // Input state
        this.keys = { up: false, down: false, left: false, right: false, action: false, special: false };

        // Animation loop
        this._rafId  = null;
        this._lastTs = 0;

        // HUD elements
        this._hudAct    = document.getElementById('actIndicator');
        this._hudTitle  = document.getElementById('actTitle');
        this._hudScore  = document.getElementById('scoreDisplay');
        this._hudFill   = document.getElementById('hpBarFill');
        this._banner    = document.getElementById('banner');
        this._bannerTid = null;

        // Overlays
        this._ovStart    = document.getElementById('overlayStart');
        this._ovIntro    = document.getElementById('overlayActIntro');
        this._ovGameOver = document.getElementById('overlayGameOver');
        this._ovVictory  = document.getElementById('overlayVictory');

        // Wire overlay buttons
        document.getElementById('btnStartGame').addEventListener('click', () => this.switchAct(1));
        document.getElementById('btnStartAct').addEventListener('click', () => {
            this._ovIntro.classList.add('hidden');
            this._startCurrentAct();
        });
        document.getElementById('btnRetry').addEventListener('click', () => {
            this._ovGameOver.classList.add('hidden');
            this.switchAct(this.currentAct);
        });
        document.getElementById('btnReturnPortal').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        document.getElementById('btnNextAct').addEventListener('click', () => {
            this._ovVictory.classList.add('hidden');
            const next = this.currentAct + 1;
            if (next <= 5) this.switchAct(next);
            else this._showFinalEnd();
        });

        // Wire keyboard
        this._wireKeyboard();

        // Wire D-pad & action buttons (mobile)
        this._wireMobile();
    }

    // ─── Public ────────────────────────────────────────────────

    /** Acts call this once in their script to register themselves */
    registerAct(n, actInstance) {
        this._acts[n] = actInstance;
    }

    /** Switch to act n: resets HP, stops old act, shows intro overlay */
    switchAct(n) {
        this.gameRunning = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

        // Cleanup previous act
        const prev = this._acts[this.currentAct];
        if (prev && prev.cleanup) prev.cleanup();

        this.currentAct = n;
        this.playerHP   = this.maxHP;
        this._updateHUD();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Show Act intro overlay
        this._hideAllOverlays();

        const actMeta = ACT_META[n];
        document.getElementById('introSeal').textContent  = actMeta.seal;
        document.getElementById('introTitle').textContent = actMeta.name;
        document.getElementById('introDesc').textContent  = actMeta.desc;
        this._hudAct.textContent   = `Act ${n}`;
        this._hudTitle.textContent = actMeta.shortTitle;

        // Toggle special button visibility (Act V only)
        const sp = document.getElementById('btnSpecial');
        if (n === 5) sp.classList.add('visible');
        else sp.classList.remove('visible');

        this._ovIntro.classList.remove('hidden');
    }

    /** Damage the player. Returns true if player died. */
    damagePlayer(amount) {
        this.playerHP = Math.max(0, this.playerHP - amount);
        this._updateHUD();
        if (this.playerHP <= 0) {
            this.showGameOver();
            return true;
        }
        return false;
    }

    healPlayer(amount) {
        this.playerHP = Math.min(this.maxHP, this.playerHP + amount);
        this._updateHUD();
    }

    addScore(n) {
        this.score += n;
        this._hudScore.textContent = this.score;
    }

    /** Show a timed banner message */
    showBanner(text, durationMs = 2200) {
        this._banner.textContent = text;
        this._banner.classList.add('visible');
        clearTimeout(this._bannerTid);
        this._bannerTid = setTimeout(() => this._banner.classList.remove('visible'), durationMs);
    }

    showGameOver() {
        this.gameRunning = false;
        document.getElementById('gameOverScore').textContent = `Final Score: ${this.score}`;
        this._hideAllOverlays();
        this._ovGameOver.classList.remove('hidden');
    }

    showVictory(title, desc, seal = '👑') {
        this.gameRunning = false;
        document.getElementById('victorySeal').textContent   = seal;
        document.getElementById('victoryTitle').textContent  = title;
        document.getElementById('victoryDesc').textContent   = desc;
        this._hideAllOverlays();
        this._ovVictory.classList.remove('hidden');
    }

    // ─── Internal ──────────────────────────────────────────────

    _startCurrentAct() {
        const act = this._acts[this.currentAct];
        if (!act) { console.warn('No act registered for', this.currentAct); return; }
        this.gameRunning = true;
        act.init(this);
        this._lastTs = performance.now();
        this._tick(this._lastTs);
    }

    _tick(ts) {
        if (!this.gameRunning) return;
        const dt = Math.min((ts - this._lastTs) / 1000, 0.05); // cap at 50ms
        this._lastTs = ts;
        const act = this._acts[this.currentAct];
        if (act) {
            act.update(dt, this.keys);
            act.draw(this.ctx, this.canvas.width, this.canvas.height);
        }
        this._rafId = requestAnimationFrame(t => this._tick(t));
    }

    _resizeCanvas() {
        const wrapper = document.getElementById('canvasWrapper');
        this.canvas.width  = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        // Notify current act of resize
        const act = this._acts[this.currentAct];
        if (act && act.onResize) act.onResize(this.canvas.width, this.canvas.height);
    }

    _updateHUD() {
        const pct = (this.playerHP / this.maxHP) * 100;
        this._hudFill.style.width = pct + '%';
        // Color shift
        if (pct > 50) this._hudFill.style.background = 'linear-gradient(90deg,#ff1a1a,#e74c3c)';
        else if (pct > 25) this._hudFill.style.background = 'linear-gradient(90deg,#ff6600,#e74c3c)';
        else this._hudFill.style.background = 'linear-gradient(90deg,#ff0000,#8b0000)';
    }

    _hideAllOverlays() {
        this._ovStart.classList.add('hidden');
        this._ovIntro.classList.add('hidden');
        this._ovGameOver.classList.add('hidden');
        this._ovVictory.classList.add('hidden');
    }

    _showFinalEnd() {
        this.showVictory(
            '"Stars, hide your fires..."',
            'Macbeth has fallen. Scotland is free. Malcolm takes the throne.\nFinal Score: ' + this.score,
            '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
        );
        document.getElementById('btnNextAct').textContent = 'Return to Portal';
        document.getElementById('btnNextAct').onclick = () => { window.location.href = 'index.html'; };
    }

    _wireKeyboard() {
        const map = { ArrowUp:'up', w:'up', ArrowDown:'down', s:'down',
                      ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right',
                      ' ':'action', Enter:'action', z:'action', Shift:'special' };
        window.addEventListener('keydown', e => {
            const k = map[e.key];
            if (k) { this.keys[k] = true; e.preventDefault(); }
        });
        window.addEventListener('keyup', e => {
            const k = map[e.key];
            if (k) { this.keys[k] = false; }
        });
    }

    _wireMobile() {
        const map = {
            'dpad-up': 'up', 'dpad-down': 'down',
            'dpad-left': 'left', 'dpad-right': 'right',
            'btnAction': 'action', 'btnSpecial': 'special'
        };
        Object.entries(map).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (!el) return;
            const down = e => { e.preventDefault(); this.keys[key] = true;  el.classList.add('pressed'); };
            const up   = e => { e.preventDefault(); this.keys[key] = false; el.classList.remove('pressed'); };
            el.addEventListener('touchstart', down, { passive: false });
            el.addEventListener('touchend',   up,   { passive: false });
            el.addEventListener('touchcancel',up,   { passive: false });
            el.addEventListener('mousedown', down);
            el.addEventListener('mouseup',   up);
            el.addEventListener('mouseleave',up);
        });
    }
}

// ─── Act metadata ─────────────────────────────────────────────
const ACT_META = {
    1: { seal: '🏰', name: 'Act I — The Labyrinth',       shortTitle: 'The Labyrinth',       desc: 'Collect all the crowns and evade the guards. You cannot fight — not yet. Survival depends on wit, not strength.' },
    2: { seal: '🗡️',  name: 'Act II — The Assassination',  shortTitle: 'The Assassination',   desc: 'Macbeth moves through the castle. Dispatch the guards. Then slay King Duncan. Your daggers are ready.' },
    3: { seal: '🌲', name: 'Act III — The Chase',          shortTitle: 'The Chase',           desc: 'Flee through Birnam Wood. Dodge rocks and fallen trees. The enemy is close — do not slow down.' },
    4: { seal: '📜', name: 'Act IV — The Plea',            shortTitle: 'The Plea',            desc: 'The prophecies unfold. Witness the vision of the witches and the gathering storm.' },
    5: { seal: '⚔️', name: 'Act V — The Final Battle',     shortTitle: 'The Final Battle',    desc: 'Malcolm faces Macbeth in single combat. The tyrant falls today, or Malcolm does.' },
};

// ─── Bootstrap ────────────────────────────────────────────────
const GAME = new ActController();
