const TRIVIA_DATA = [
    {
        q: "1. What do the three witches predict for Macbeth at the beginning of the play?",
        options: [
            "A) That he will become King of Scotland.",
            "B) That he will live forever.",
            "C) That he will never marry Lady Macbeth."
        ],
        answer: 0
    },
    {
        q: "2. Who is Macbeth's best friend at the start of the story, who is later murdered by his order?",
        options: [
            "A) Duncan.",
            "B) Banquo.",
            "C) Macduff."
        ],
        answer: 1
    },
    {
        q: "3. What does Lady Macbeth constantly try to wash off her hands while sleepwalking?",
        options: [
            "A) Sand.",
            "B) Imaginary blood.",
            "C) Black ink."
        ],
        answer: 1
    },
    {
        q: "4. Who is the rightful King of Scotland that Macbeth murders at the beginning?",
        options: [
            "A) Malcolm.",
            "B) Duncan.",
            "C) Siward."
        ],
        answer: 1
    },
    {
        q: "5. According to the witches, who is the only man capable of defeating Macbeth?",
        options: [
            "A) One not born of a woman (C-section).",
            "B) Banquo's son.",
            "C) A foreign warrior."
        ],
        answer: 0
    },
    {
        q: "6. What object does Macbeth see before murdering King Duncan?",
        options: [
            "A) A giant raven.",
            "B) A golden crown.",
            "C) A floating dagger."
        ],
        answer: 2
    },
    {
        q: "7. To which country does Malcolm flee after the murder of his father, King Duncan?",
        options: [
            "A) England.",
            "B) France.",
            "C) Norway."
        ],
        answer: 0
    },
    {
        q: "8. What is Lady Macbeth's final fate?",
        options: [
            "A) She is banished from Scotland.",
            "B) She dies (suicide).",
            "C) She becomes the ruling Queen."
        ],
        answer: 1
    },
    {
        q: "9. What assurance do the witches give Macbeth regarding his safety?",
        options: [
            "A) \"Be happy and fear no one.\"",
            "B) \"No man of woman born shall harm thee.\"",
            "C) \"Your son will succeed you on the throne.\""
        ],
        answer: 1
    },
    {
        q: "10. How does the play end?",
        options: [
            "A) Macbeth repents and is forgiven.",
            "B) Macduff defeats Macbeth in combat and Malcolm is crowned King.",
            "C) The witches return and seize the throne."
        ],
        answer: 1
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("trivia-form");
    
    // Initial display
    window.TRIVIA_SCORE.updateDisplay();

    TRIVIA_DATA.forEach((item, index) => {
        // Create question block
        const block = document.createElement("div");
        block.className = "question-block";

        const title = document.createElement("h3");
        title.textContent = item.q;
        block.appendChild(title);

        // Result span for the star
        const resultSpan = document.createElement("span");
        resultSpan.className = "result-star";
        block.appendChild(resultSpan);

        const optionsDiv = document.createElement("div");
        optionsDiv.className = "options-group";

        item.options.forEach((optText, optIndex) => {
            const label = document.createElement("label");
            label.className = "option-label";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question-${index}`;
            radio.value = optIndex;

            radio.addEventListener("change", () => {
                // Disable all radios for this question after answering
                const allRadios = block.querySelectorAll(`input[name="question-${index}"]`);
                allRadios.forEach(r => r.disabled = true);

                if (parseInt(radio.value) === item.answer) {
                    label.classList.add("correct");
                    resultSpan.textContent = " ⭐ Correct!";
                    window.TRIVIA_SCORE.addPoint();
                } else {
                    label.classList.add("incorrect");
                    resultSpan.textContent = " ❌ Incorrect";
                    resultSpan.style.color = "#ff4d4d";
                    
                    // Highlight the correct one
                    allRadios[item.answer].parentElement.classList.add("correct-hint");
                }
            });

            label.appendChild(radio);
            label.appendChild(document.createTextNode(" " + optText));
            optionsDiv.appendChild(label);
        });

        block.appendChild(optionsDiv);
        container.appendChild(block);
    });
});
