class TriviaScore {
    constructor() {
        this.score = 0;
        this.total = 10;
    }

    addPoint() {
        this.score++;
        this.updateDisplay();
    }

    updateDisplay() {
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) {
            scoreEl.textContent = `Score: ${this.score} / ${this.total}`;
        }
    }
}

// Global counter instance
window.TRIVIA_SCORE = new TriviaScore();
