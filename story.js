// Interactive Macbeth Story Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const canvas = document.getElementById('storyCanvas');
    const ctx = canvas.getContext('2d');
    const actBtns = document.querySelectorAll('.act-btn');
    const actTitle = document.getElementById('actTitle');
    const actLocation = document.getElementById('actLocation');
    const actText = document.getElementById('actText');
    const actQuote = document.getElementById('actQuote');
    const actQuoteSource = document.getElementById('actQuoteSource');
    const actHint = document.getElementById('actHint');
    const sliderContainer = document.getElementById('sliderContainer');
    const woodSlider = document.getElementById('woodSlider');
    const sliderLabel = document.getElementById('sliderLabel');
    const canvasInstruction = document.getElementById('canvasInstruction');

    // 2. State Variables
    let currentAct = 1;
    let time = 0;

    // Load assets
    const images = {
        macbeth: new Image(),
        dagger: new Image(),
        ghost: new Image(),
        blood: new Image(),
        crown: new Image(),
        potion: new Image()
    };
    images.macbeth.src = 'assets/macbeth_sprite.png';
    images.dagger.src = 'assets/dagger_sprite.png';
    images.ghost.src = 'assets/banquo_ghost.png';
    images.blood.src = 'assets/blood_stain.png';
    images.crown.src = 'assets/crown_point.png';
    images.potion.src = 'assets/witch_potion.png';

    // Act narrative data
    const actData = {
        1: {
            title: "Act I: The Weird Sisters' Prophecy",
            location: "Location: A Foggy Heath near Forres",
            text: "Returning from battle, generals Macbeth and Banquo meet three Witches on a stormy heath. They prophecy that Macbeth will be named Thane of Cawdor and then King, and that Banquo's descendants will inherit the throne. Soon after, messengers arrive to name Macbeth Thane of Cawdor. Ambition is born.",
            quote: "“Fair is foul, and foul is fair: Hover through the fog and filthy air.”",
            source: "— The Witches, Act I, Scene I",
            hint: "Tap the cauldron on the left to add ingredients (Eye of Newt, Toe of Frog, Bat Wing) and reveal the prophecies!"
        },
        2: {
            title: "Act II: The Dagger & Duncan's Murder",
            location: "Location: Inverness Castle (Macbeth's Castle)",
            text: "Macbeth is hesitant, but his wife Lady Macbeth manipulates him into committing regicide. Walking down the dark castle hall to Duncan's bedchamber, Macbeth is haunted by a vision of a floating, bloody dagger pointing towards the sleeping King. He commits the murder, but is immediately struck by terror and guilt.",
            quote: "“Is this a dagger which I see before me, the handle toward my hand? Come, let me clutch thee.”",
            source: "— Macbeth, Act II, Scene I",
            hint: "Tap the canvas to float the spectral dagger forward and splatter blood, paving the path to King Duncan's doom."
        },
        3: {
            title: "Act III: Banquo's Ghost at the Feast",
            location: "Location: The Palace of Scone (Royal Banquet)",
            text: "Crowned King, Macbeth becomes paranoid that Banquo's heirs will overthrow him. He orders assassins to slay Banquo and his son Fleance; Fleance escapes, but Banquo is killed. At a grand feast, Macbeth sees Banquo's bloody ghost sitting in his throne. Macbeth panics, shouting in terror and revealing his unstable mind.",
            quote: "“Thou canst not say I did it: never shake thy gory locks at me.”",
            source: "— Macbeth, Act III, Scene IV",
            hint: "Click the empty golden throne to manifest Banquo's bloody specter, driving Macbeth into public hysteria."
        },
        4: {
            title: "Act IV: The Cauldron of Illusions",
            location: "Location: The Witches' Cavern (A Dark Cave)",
            text: "Desperate to secure his crown, Macbeth returns to the three Witches. They stir a bubbling cauldron and summon three spectral Apparitions. They warn him to beware Macduff, but assure him that 'none of woman born' shall harm him, and he will never fall until Birnam Wood moves to Dunsinane. Macbeth believes he is invincible.",
            quote: "“Double, double toil and trouble; Fire burn, and cauldron bubble.”",
            source: "— The Witches, Act IV, Scene I",
            hint: "Tap the cave cauldron to conjure the Witches' three warnings and see what Macbeth's fate holds."
        },
        5: {
            title: "Act V: Dunsinane & The Fall of the Tyrant",
            location: "Location: Dunsinane Castle / Birnam Wood",
            text: "English forces led by Malcolm and Macduff advance. To hide their numbers, soldiers cut branches from Birnam Wood and march with them. Looking out, Macbeth sees the forest moving. Macduff, revealed to have been born via Caesarean section (not 'woman born' in the traditional sense), defeats and beheads Macbeth.",
            quote: "“Out, damned spot! out, I say!... Life's but a walking shadow, a poor player that struts and frets his hour upon the stage...”",
            source: "— Lady Macbeth & Macbeth, Act V",
            hint: "Use the slider below the canvas to march Birnam Wood to Dunsinane and witness the tyrant's crown fall."
        }
    };

    // 3. Act-Specific Animation States
    // Act 1: Witches
    const act1State = {
        clicks: 0,
        bubbles: [],
        ingredients: [],
        prophecies: [],
        glow: 0
    };

    // Act 2: Dagger
    const act2State = {
        daggerX: 80,
        daggerY: 200,
        bloodStains: [],
        drips: [],
        clicks: 0
    };

    // Act 3: Banquo's Ghost
    const act3State = {
        ghostOpacity: 0,
        targetOpacity: 0,
        isGhostActive: false,
        spookyParticles: [],
        flicker: 1
    };

    // Act 4: Cauldron Apparitions
    const act4State = {
        clicks: 0,
        smokeParticles: [],
        apparitionOpacity: 0,
        targetApparitionOpacity: 0,
        currentApparition: 0, // 0: none, 1: Helmeted Head, 2: Bloody Child, 3: Crowned Child
        messages: [
            "",
            "Beware Macduff! Thane of Fife!",
            "None of woman born shall harm Macbeth!",
            "Invincible until Birnam Wood moves to Dunsinane!"
        ]
    };

    // Act 5: Dunsinane Castle
    const act5State = {
        woodAdvance: 0, // 0 to 100
        crownY: 105,
        crownX: 395,
        crownAngle: 0,
        crownFallen: false,
        crownVelY: 0,
        crownVelX: 0,
        mistOffset: 0
    };

    // 4. Initialization and Event Listeners
    function switchAct(actNum) {
        currentAct = parseInt(actNum);
        
        // Update navigation buttons
        actBtns.forEach(btn => {
            if (parseInt(btn.getAttribute('data-act')) === currentAct) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Parchment Content
        const data = actData[currentAct];
        actTitle.innerText = data.title;
        actLocation.innerText = data.location;
        actText.innerText = data.text;
        actQuote.innerText = data.quote;
        actQuoteSource.innerText = data.source;
        actHint.innerText = data.hint;

        // Toggle Act 5 slider
        if (currentAct === 5) {
            sliderContainer.classList.remove('hidden');
            canvasInstruction.classList.add('hidden');
        } else {
            sliderContainer.classList.add('hidden');
            canvasInstruction.classList.remove('hidden');
        }

        // Reset specific states
        if (currentAct === 1) {
            act1State.clicks = 0;
            act1State.prophecies = [];
        } else if (currentAct === 2) {
            act2State.daggerX = 80;
            act2State.clicks = 0;
            act2State.bloodStains = [];
        } else if (currentAct === 3) {
            act3State.isGhostActive = false;
            act3State.targetOpacity = 0;
            act3State.ghostOpacity = 0;
        } else if (currentAct === 4) {
            act4State.clicks = 0;
            act4State.currentApparition = 0;
            act4State.targetApparitionOpacity = 0;
            act4State.apparitionOpacity = 0;
        } else if (currentAct === 5) {
            woodSlider.value = 0;
            act5State.woodAdvance = 0;
            act5State.crownY = 105;
            act5State.crownX = 395;
            act5State.crownAngle = 0;
            act5State.crownFallen = false;
            act5State.crownVelY = 0;
            act5State.crownVelX = 0;
            sliderLabel.innerText = "March Birnam Wood to Dunsinane (0%)";
        }
    }

    actBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchAct(btn.getAttribute('data-act'));
        });
    });

    // Handle slider change for Act V
    woodSlider.addEventListener('input', (e) => {
        act5State.woodAdvance = parseInt(e.target.value);
        sliderLabel.innerText = `March Birnam Wood to Dunsinane (${act5State.woodAdvance}%)`;
    });

    // Handle canvas clicks/taps
    canvas.addEventListener('mousedown', handleCanvasInteraction);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        // Calculate relative coordinates
        const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
        handleInteraction(x, y);
    });

    function handleCanvasInteraction(e) {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        handleInteraction(x, y);
    }

    function handleInteraction(x, y) {
        if (currentAct === 1) {
            // Act 1: Click cauldron to throw ingredient
            act1State.clicks++;
            const ingredientsNames = ["Eye of Newt", "Toe of Frog", "Bat Wing", "Tongue of Dog"];
            const selectedIng = ingredientsNames[(act1State.clicks - 1) % ingredientsNames.length];
            
            // Add throwing animation ingredient
            act1State.ingredients.push({
                x: x,
                y: y,
                targetX: 250,
                targetY: 300,
                progress: 0,
                name: selectedIng
            });

            // Trigger prophecy floating text after some delay
            setTimeout(() => {
                let txt = "";
                if (act1State.clicks === 1) txt = "Hail Macbeth! Thane of Glamis!";
                else if (act1State.clicks === 2) txt = "Hail Macbeth! Thane of Cawdor!";
                else if (act1State.clicks === 3) txt = "Hail Macbeth! That shalt be King hereafter!";
                else txt = "All hail, Macbeth and Banquo!";

                act1State.prophecies.push({
                    text: txt,
                    x: 250,
                    y: 280,
                    alpha: 1,
                    velY: -1
                });
                
                // Add splash glow
                act1State.glow = 15;
            }, 600);

        } else if (currentAct === 2) {
            // Act 2: Move dagger closer and spawn blood stains
            act2State.clicks++;
            act2State.daggerX += 35;
            if (act2State.daggerX > 380) {
                act2State.daggerX = 80; // Reset
            }

            // Spawn blood stain
            act2State.bloodStains.push({
                x: x,
                y: y,
                size: Math.random() * 20 + 15
            });

            // Add falling drips
            for (let i = 0; i < 4; i++) {
                act2State.drips.push({
                    x: act2State.daggerX + 50,
                    y: act2State.daggerY + 20,
                    velY: Math.random() * 3 + 2,
                    velX: (Math.random() - 0.5) * 1.5,
                    alpha: 1
                });
            }

        } else if (currentAct === 3) {
            // Act 3: Summon ghost if user clicks near the throne (X: 200-300, Y: 150-300)
            if (x >= 180 && x <= 320 && y >= 140 && y <= 310) {
                act3State.isGhostActive = !act3State.isGhostActive;
                act3State.targetOpacity = act3State.isGhostActive ? 1.0 : 0.0;
                
                // Spawn mist particles
                for (let i = 0; i < 20; i++) {
                    act3State.spookyParticles.push({
                        x: 250 + (Math.random() - 0.5) * 80,
                        y: 240 + (Math.random() - 0.5) * 80,
                        size: Math.random() * 15 + 10,
                        velX: (Math.random() - 0.5) * 3,
                        velY: (Math.random() - 0.5) * 3,
                        alpha: 0.8
                    });
                }
            }

        } else if (currentAct === 4) {
            // Act 4: Conjure Apparitions on cauldron tap
            act4State.clicks++;
            act4State.currentApparition = ((act4State.clicks - 1) % 3) + 1; // 1, 2, 3
            act4State.targetApparitionOpacity = 1.0;
            act4State.apparitionOpacity = 0.0; // Fade-in from zero again
            
            // Heavy smoke particles
            for (let i = 0; i < 15; i++) {
                act4State.smokeParticles.push({
                    x: 250 + (Math.random() - 0.5) * 50,
                    y: 300,
                    size: Math.random() * 10 + 10,
                    velY: -(Math.random() * 3 + 1),
                    velX: (Math.random() - 0.5) * 2,
                    alpha: 0.9,
                    color: "rgba(100, 100, 110, 0.5)"
                });
            }
        }
    }

    // 5. Drawing & Animation Loop
    function updateAndDraw() {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch(currentAct) {
            case 1: drawAct1(); break;
            case 2: drawAct2(); break;
            case 3: drawAct3(); break;
            case 4: drawAct4(); break;
            case 5: drawAct5(); break;
        }

        requestAnimationFrame(updateAndDraw);
    }

    // --- ACT I RENDERING ---
    function drawAct1() {
        // Background - Dark foggy night
        let bgGrad = ctx.createRadialGradient(250, 200, 50, 250, 200, 300);
        bgGrad.addColorStop(0, '#2c2235');
        bgGrad.addColorStop(1, '#0e0b12');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw background silhouettes of trees
        ctx.fillStyle = "rgba(15, 12, 20, 0.7)";
        for (let i = 0; i < 6; i++) {
            let xPos = i * 90 + 30;
            ctx.beginPath();
            ctx.moveTo(xPos, 350);
            ctx.lineTo(xPos - 30, 200);
            ctx.lineTo(xPos + 30, 200);
            ctx.closePath();
            ctx.fill();
        }

        // Draw scrolling fog layers
        ctx.fillStyle = "rgba(180, 170, 190, 0.08)";
        for (let j = 0; j < 3; j++) {
            let offset = Math.sin(time * 0.01 + j * 2) * 50;
            ctx.fillRect(offset - 50, 100 + j * 50, canvas.width + 100, 150);
        }

        // Draw Cauldron
        let cauldronX = 250;
        let cauldronY = 320;
        let cauldronW = 100;
        let cauldronH = 70;

        // Glow behind cauldron
        if (act1State.glow > 0) {
            let glowGrad = ctx.createRadialGradient(cauldronX, cauldronY - 10, 5, cauldronX, cauldronY - 10, 60 + act1State.glow * 3);
            glowGrad.addColorStop(0, 'rgba(50, 220, 50, 0.4)');
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(cauldronX, cauldronY - 10, 60 + act1State.glow * 3, 0, Math.PI * 2);
            ctx.fill();
            act1State.glow -= 0.5;
        }

        // Cauldron Body
        if (images.potion.complete && images.potion.naturalWidth !== 0) {
            ctx.drawImage(images.potion, cauldronX - 55, cauldronY - 45, 110, 100);
        } else {
            // Fallback Vector cauldron
            ctx.fillStyle = '#1e1c1b';
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cauldronX, cauldronY + 10, 45, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cauldron Lip
            ctx.fillStyle = '#2c2928';
            ctx.fillRect(cauldronX - 50, cauldronY - 10, 100, 15);
            ctx.strokeRect(cauldronX - 50, cauldronY - 10, 100, 15);
        }

        // Cauldron brew liquid
        ctx.fillStyle = '#32cd32';
        ctx.beginPath();
        ctx.ellipse(cauldronX, cauldronY - 8, 42, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Update & Draw flying ingredients
        act1State.ingredients.forEach((ing, index) => {
            ing.progress += 0.04;
            if (ing.progress >= 1.0) {
                // Landed inside cauldron, splash particles
                for (let k = 0; k < 8; k++) {
                    act1State.bubbles.push({
                        x: cauldronX + (Math.random() - 0.5) * 40,
                        y: cauldronY - 10,
                        velY: -(Math.random() * 2 + 1),
                        velX: (Math.random() - 0.5) * 2,
                        size: Math.random() * 8 + 4,
                        color: "rgba(50, 255, 50, 0.8)",
                        life: 1.0
                    });
                }
                act1State.ingredients.splice(index, 1);
            } else {
                // Draw path parabola
                let currentX = ing.x + (ing.targetX - ing.x) * ing.progress;
                let currentY = ing.y + (ing.targetY - ing.y) * ing.progress - Math.sin(ing.progress * Math.PI) * 100;
                
                ctx.fillStyle = '#d4af37';
                ctx.beginPath();
                ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = "italic 10px monospace";
                ctx.fillText(ing.name, currentX + 8, currentY - 5);
            }
        });

        // Spawn occasional bubbles
        if (Math.random() < 0.15) {
            act1State.bubbles.push({
                x: cauldronX + (Math.random() - 0.5) * 60,
                y: cauldronY - 10,
                velY: -(Math.random() * 1.5 + 0.5),
                velX: (Math.random() - 0.5) * 1,
                size: Math.random() * 6 + 2,
                color: Math.random() > 0.3 ? "rgba(50, 205, 50, 0.6)" : "rgba(173, 255, 47, 0.7)",
                life: 1.0
            });
        }

        // Draw bubbles
        act1State.bubbles.forEach((b, index) => {
            b.y += b.velY;
            b.x += b.velX + Math.sin(time * 0.05 + index) * 0.5;
            b.life -= 0.01;
            if (b.y < 0 || b.life <= 0) {
                act1State.bubbles.splice(index, 1);
            } else {
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Prophecies texts
        act1State.prophecies.forEach((p, index) => {
            p.y += p.velY;
            p.alpha -= 0.008;
            if (p.alpha <= 0) {
                act1State.prophecies.splice(index, 1);
            } else {
                ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
                ctx.font = "bold 13px 'MedievalSharp', cursive";
                ctx.textAlign = "center";
                ctx.fillText(p.text, p.x, p.y);
            }
        });

        // Draw Witches in silhouette on the sides
        ctx.fillStyle = "rgba(10, 8, 12, 0.85)";
        // Left witch
        ctx.beginPath();
        ctx.moveTo(40, 380);
        ctx.lineTo(80, 260);
        ctx.lineTo(120, 380);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath(); // Hood
        ctx.arc(80, 255, 12, 0, Math.PI * 2);
        ctx.fill();

        // Right witch
        ctx.beginPath();
        ctx.moveTo(380, 380);
        ctx.lineTo(420, 270);
        ctx.lineTo(460, 380);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath(); // Hood
        ctx.arc(420, 265, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- ACT II RENDERING ---
    function drawAct2() {
        // Hallway background - Dark Stone Castle
        ctx.fillStyle = '#1e1c1b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Stone borders & perspective lines
        ctx.strokeStyle = '#2d2824';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            let y = 80 * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Bricks vertical cuts
        ctx.fillStyle = '#171514';
        for (let row = 0; row < 5; row++) {
            let offset = (row % 2) * 50;
            for (let col = 0; col < 6; col++) {
                ctx.fillRect(col * 100 + offset, row * 80, 2, 80);
            }
        }

        // Royal Chamber door on the right
        ctx.fillStyle = '#3a2312';
        ctx.fillRect(400, 100, 80, 250);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(400, 100, 80, 250);

        // Door details (gilded studs)
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(435, 210, 10, 30);
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(440, 225, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow coming from the door gap (Duncan's light)
        let goldGrad = ctx.createLinearGradient(400, 0, 420, 0);
        goldGrad.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        goldGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = goldGrad;
        ctx.fillRect(360, 100, 40, 250);

        // Draw Blood Stains
        act2State.bloodStains.forEach(stain => {
            if (images.blood.complete && images.blood.naturalWidth !== 0) {
                ctx.drawImage(images.blood, stain.x - stain.size/2, stain.y - stain.size/2, stain.size, stain.size);
            } else {
                ctx.fillStyle = 'rgba(139, 30, 30, 0.85)';
                ctx.beginPath();
                ctx.arc(stain.x, stain.y, stain.size/2, 0, Math.PI * 2);
                ctx.fill();
                // Splash droplets
                for (let s = 0; s < 4; s++) {
                    let rx = stain.x + (Math.random() - 0.5) * stain.size * 1.2;
                    let ry = stain.y + (Math.random() - 0.5) * stain.size * 1.2;
                    ctx.beginPath();
                    ctx.arc(rx, ry, stain.size/6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Update and draw falling blood drips
        act2State.drips.forEach((d, index) => {
            d.y += d.velY;
            d.x += d.velX;
            d.alpha -= 0.015;
            if (d.y > 380 || d.alpha <= 0) {
                act2State.drips.splice(index, 1);
            } else {
                ctx.fillStyle = `rgba(139, 30, 30, ${d.alpha})`;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Floating Dagger (swaying side to side)
        let floatY = act2State.daggerY + Math.sin(time * 0.08) * 8;
        let daggerW = 90;
        let daggerH = 30;

        // Draw floating dagger glow
        let daggerGlow = ctx.createRadialGradient(act2State.daggerX + 40, floatY + 10, 5, act2State.daggerX + 40, floatY + 10, 45);
        daggerGlow.addColorStop(0, 'rgba(150, 0, 0, 0.45)');
        daggerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = daggerGlow;
        ctx.beginPath();
        ctx.arc(act2State.daggerX + 40, floatY + 10, 45, 0, Math.PI * 2);
        ctx.fill();

        if (images.dagger.complete && images.dagger.naturalWidth !== 0) {
            // Rotate slightly towards the door
            ctx.save();
            ctx.translate(act2State.daggerX + daggerW/2, floatY + daggerH/2);
            ctx.rotate(0.12);
            ctx.drawImage(images.dagger, -daggerW/2, -daggerH/2, daggerW, daggerH);
            ctx.restore();
        } else {
            // Draw stylized vector red glowing dagger
            ctx.save();
            ctx.translate(act2State.daggerX, floatY);
            ctx.rotate(0.15); // angle slightly down to door
            
            // Blade
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#ff3333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(35, 10);
            ctx.lineTo(80, 10); // Point
            ctx.lineTo(35, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Hilt
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(15, 12, 20, 4); // Handle
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(31, 5, 4, 18); // Crossguard
            
            ctx.restore();
        }

        // Draw Macbeth silhouette hovering from the left
        ctx.fillStyle = 'rgba(10, 8, 8, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-50, 400);
        ctx.lineTo(40, 240);
        ctx.lineTo(90, 400);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath(); // head
        ctx.arc(45, 230, 15, 0, Math.PI*2);
        ctx.fill();
    }

    // --- ACT III RENDERING ---
    function drawAct3() {
        // Banquet Hall Background
        let wallGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        wallGrad.addColorStop(0, '#1c1511');
        wallGrad.addColorStop(1, '#0b0806');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Table
        ctx.fillStyle = '#422818';
        ctx.fillRect(50, 310, 400, 90);
        ctx.strokeStyle = '#5e3820';
        ctx.lineWidth = 3;
        ctx.strokeRect(50, 310, 400, 90);

        // Candles on the table
        act3State.flicker = 1.0 + Math.sin(time * 0.15) * 0.08;
        const drawCandle = (cx) => {
            ctx.fillStyle = '#d8cca3';
            ctx.fillRect(cx - 3, 280, 6, 30);
            // flame
            let flameG = ctx.createRadialGradient(cx, 275, 1, cx, 275, 10);
            flameG.addColorStop(0, 'rgba(255, 180, 50, 1.0)');
            flameG.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = flameG;
            ctx.beginPath();
            ctx.arc(cx, 275, 8 * act3State.flicker, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCandle(90);
        drawCandle(390);

        // Empty Royal Throne (Center)
        let throneX = 250;
        let throneY = 230;

        ctx.fillStyle = '#8b6914'; // Gold Frame
        ctx.fillRect(throneX - 35, throneY - 60, 70, 140);
        ctx.fillStyle = '#800000'; // Velvet seat back
        ctx.fillRect(throneX - 27, throneY - 50, 54, 90);

        // Armrests
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(throneX - 35, throneY + 20, 10, 30);
        ctx.fillRect(throneX + 25, throneY + 20, 10, 30);
        ctx.fillRect(throneX - 35, throneY + 15, 70, 7); // Seat bottom cushion

        // Draw Banquo's Ghost on the throne
        if (act3State.ghostOpacity > 0.01) {
            ctx.save();
            ctx.globalAlpha = act3State.ghostOpacity;
            
            // Spooky spectral green aura behind ghost
            let spectralG = ctx.createRadialGradient(throneX, throneY + 10, 10, throneX, throneY + 10, 55);
            spectralG.addColorStop(0, 'rgba(100, 220, 150, 0.45)');
            spectralG.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = spectralG;
            ctx.beginPath();
            ctx.arc(throneX, throneY + 10, 55, 0, Math.PI * 2);
            ctx.fill();

            if (images.ghost.complete && images.ghost.naturalWidth !== 0) {
                // Adjust sprite aspect and position on the seat
                ctx.drawImage(images.ghost, throneX - 45, throneY - 45, 90, 110);
            } else {
                // Vector Ghost representation (greenish glowing skeletal figure)
                ctx.fillStyle = '#64e696';
                ctx.strokeStyle = '#32cd32';
                ctx.lineWidth = 2;
                
                // Head
                ctx.beginPath();
                ctx.arc(throneX, throneY - 15, 15, 0, Math.PI*2);
                ctx.fill();
                // Ribcage lines
                ctx.beginPath();
                ctx.moveTo(throneX, throneY);
                ctx.lineTo(throneX, throneY + 40);
                ctx.moveTo(throneX - 15, throneY + 10);
                ctx.lineTo(throneX + 15, throneY + 10);
                ctx.moveTo(throneX - 12, throneY + 20);
                ctx.lineTo(throneX + 12, throneY + 20);
                ctx.moveTo(throneX - 10, throneY + 30);
                ctx.lineTo(throneX + 10, throneY + 30);
                ctx.stroke();

                // Gory locks blood dripping from head
                ctx.fillStyle = '#8b0000';
                for (let r = 0; r < 4; r++) {
                    ctx.fillRect(throneX - 12 + r*6, throneY - 5 + Math.sin(time*0.1 + r)*3, 4, 8);
                }
            }
            ctx.restore();
        }

        // Animate ghost opacity towards target
        if (Math.abs(act3State.ghostOpacity - act3State.targetOpacity) > 0.02) {
            act3State.ghostOpacity += (act3State.targetOpacity - act3State.ghostOpacity) * 0.05;
        } else {
            act3State.ghostOpacity = act3State.targetOpacity;
        }

        // Update & Draw spooky mist particles
        act3State.spookyParticles.forEach((p, index) => {
            p.x += p.velX;
            p.y += p.velY;
            p.alpha -= 0.02;
            if (p.alpha <= 0) {
                act3State.spookyParticles.splice(index, 1);
            } else {
                ctx.fillStyle = `rgba(144, 238, 144, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Terrified Macbeth on the left
        ctx.fillStyle = '#2c1e17';
        // Legs & robes
        ctx.beginPath();
        ctx.moveTo(70, 400);
        ctx.lineTo(110, 270);
        ctx.lineTo(150, 400);
        ctx.closePath();
        ctx.fill();

        // Crown on his head
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(100, 250);
        ctx.lineTo(120, 250);
        ctx.lineTo(125, 262);
        ctx.lineTo(95, 262);
        ctx.closePath();
        ctx.fill();

        // Spooky sweat/terrified shock lines
        if (act3State.ghostOpacity > 0.4) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            for (let s = 0; s < 3; s++) {
                let sy = 230 + s * 6;
                ctx.beginPath();
                ctx.moveTo(130 + s*3, sy);
                ctx.lineTo(142 + s*3, sy + 3);
                ctx.stroke();
            }
            // Speech text
            ctx.fillStyle = '#fff';
            ctx.font = "italic 11px Georgia";
            ctx.fillText("Avaunt! and quit my sight!", 70, 220);
        }
    }

    // --- ACT IV RENDERING ---
    function drawAct4() {
        // Cave Background
        ctx.fillStyle = '#0f0c0b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw cave rocks
        ctx.fillStyle = '#221a17';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(80, 100);
        ctx.lineTo(0, 200);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(canvas.width, 0);
        ctx.lineTo(canvas.width - 90, 130);
        ctx.lineTo(canvas.width, 220);
        ctx.closePath();
        ctx.fill();

        // Cauldron at the bottom center
        let cauldronX = 250;
        let cauldronY = 325;

        // Draw cauldron brew glow (purple for dark magic)
        let brewGlow = ctx.createRadialGradient(cauldronX, cauldronY - 10, 5, cauldronX, cauldronY - 10, 75);
        brewGlow.addColorStop(0, 'rgba(128, 0, 128, 0.4)');
        brewGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = brewGlow;
        ctx.beginPath();
        ctx.arc(cauldronX, cauldronY - 10, 75, 0, Math.PI * 2);
        ctx.fill();

        if (images.potion.complete && images.potion.naturalWidth !== 0) {
            ctx.drawImage(images.potion, cauldronX - 55, cauldronY - 45, 110, 100);
        } else {
            ctx.fillStyle = '#11100f';
            ctx.strokeStyle = '#5c4033';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cauldronX, cauldronY + 10, 45, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Lip
            ctx.fillStyle = '#1c1b1a';
            ctx.fillRect(cauldronX - 50, cauldronY - 10, 100, 15);
            ctx.strokeRect(cauldronX - 50, cauldronY - 10, 100, 15);
        }

        // Brew liquid (purple)
        ctx.fillStyle = '#800080';
        ctx.beginPath();
        ctx.ellipse(cauldronX, cauldronY - 8, 42, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Smoke animations from cauldron
        if (Math.random() < 0.25 || act4State.smokeParticles.length < 5) {
            act4State.smokeParticles.push({
                x: cauldronX + (Math.random() - 0.5) * 45,
                y: cauldronY - 10,
                velY: -(Math.random() * 2 + 1),
                velX: (Math.random() - 0.5) * 2.5,
                size: Math.random() * 20 + 10,
                alpha: 0.75,
                color: "rgba(100, 80, 110, 0.4)"
            });
        }

        // Update smoke
        act4State.smokeParticles.forEach((p, index) => {
            p.y += p.velY;
            p.x += p.velX + Math.sin(time*0.03 + index)*0.6;
            p.size += 0.25;
            p.alpha -= 0.008;
            if (p.alpha <= 0) {
                act4State.smokeParticles.splice(index, 1);
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // Apparitions fading in
        if (act4State.currentApparition > 0) {
            if (act4State.apparitionOpacity < 1.0) {
                act4State.apparitionOpacity += 0.04;
            } else {
                act4State.apparitionOpacity = 1.0;
            }

            ctx.save();
            ctx.globalAlpha = act4State.apparitionOpacity;

            // Draw current apparition floating above cauldron
            let appX = 250;
            let appY = 150 + Math.sin(time * 0.06) * 10;

            // Apparition spectral light glow
            let appGlow = ctx.createRadialGradient(appX, appY, 10, appX, appY, 60);
            appGlow.addColorStop(0, 'rgba(200, 200, 255, 0.35)');
            appGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = appGlow;
            ctx.beginPath();
            ctx.arc(appX, appY, 60, 0, Math.PI * 2);
            ctx.fill();

            if (act4State.currentApparition === 1) {
                // Apparition I: Armed Head
                ctx.fillStyle = '#c0c0c0';
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 2;
                // Helmet outline
                ctx.beginPath();
                ctx.arc(appX, appY, 25, 0, Math.PI, true);
                ctx.lineTo(appX + 25, appY + 25);
                ctx.lineTo(appX - 25, appY + 25);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Visor slit
                ctx.fillStyle = '#000';
                ctx.fillRect(appX - 15, appY - 8, 30, 5);

            } else if (act4State.currentApparition === 2) {
                // Apparition II: Bloody Child
                ctx.fillStyle = 'rgba(255, 120, 120, 0.9)';
                ctx.beginPath();
                // head
                ctx.arc(appX, appY - 15, 12, 0, Math.PI * 2);
                // body
                ctx.moveTo(appX, appY - 5);
                ctx.lineTo(appX - 10, appY + 20);
                ctx.lineTo(appX + 10, appY + 20);
                ctx.closePath();
                ctx.fill();
                // blood spots
                ctx.fillStyle = '#8b0000';
                ctx.beginPath();
                ctx.arc(appX - 3, appY - 15, 3, 0, Math.PI*2);
                ctx.arc(appX + 2, appY + 5, 4, 0, Math.PI*2);
                ctx.fill();

            } else if (act4State.currentApparition === 3) {
                // Apparition III: Crowned Child holding tree
                // Child Silhouette
                ctx.fillStyle = '#ffe4c4';
                ctx.beginPath();
                ctx.arc(appX, appY, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Crown
                ctx.fillStyle = '#d4af37';
                ctx.beginPath();
                ctx.moveTo(appX - 15, appY - 12);
                ctx.lineTo(appX - 10, appY - 25);
                ctx.lineTo(appX, appY - 16);
                ctx.lineTo(appX + 10, appY - 25);
                ctx.lineTo(appX + 15, appY - 12);
                ctx.closePath();
                ctx.fill();

                // Branch
                ctx.strokeStyle = '#228b22';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(appX + 12, appY + 5);
                ctx.lineTo(appX + 35, appY - 10);
                ctx.stroke();
                // leaves
                ctx.fillStyle = '#228b22';
                ctx.beginPath();
                ctx.arc(appX + 35, appY - 10, 6, 0, Math.PI*2);
                ctx.arc(appX + 28, appY - 5, 5, 0, Math.PI*2);
                ctx.fill();
            }

            // Message text bubble
            ctx.fillStyle = 'rgba(15, 12, 12, 0.9)';
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 2;
            ctx.fillRect(80, 50, 340, 45);
            ctx.strokeRect(80, 50, 340, 45);

            ctx.fillStyle = '#d4af37';
            ctx.font = "bold italic 11px Georgia";
            ctx.textAlign = 'center';
            ctx.fillText(act4State.messages[act4State.currentApparition], 250, 76);

            ctx.restore();
        }
    }

    // --- ACT V RENDERING ---
    function drawAct5() {
        // Act V Background - twilight / stormy sky
        // Transition from blueish grey to dark red as wood advances
        let redComponent = Math.floor((act5State.woodAdvance / 100) * 80);
        ctx.fillStyle = `rgb(${15 + redComponent}, 15, 20)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Castle on the hill (right side)
        ctx.fillStyle = '#2c2927';
        ctx.beginPath();
        ctx.moveTo(300, 400);
        ctx.lineTo(330, 200);
        ctx.lineTo(470, 200);
        ctx.lineTo(500, 400);
        ctx.closePath();
        ctx.fill();

        // Castle towers & battlements
        ctx.fillRect(330, 130, 45, 70);
        ctx.fillRect(425, 130, 45, 70);
        
        ctx.fillStyle = '#1e1c1b';
        ctx.fillRect(330, 130, 10, 15);
        ctx.fillRect(350, 130, 10, 15);
        ctx.fillRect(365, 130, 10, 15);
        ctx.fillRect(425, 130, 10, 15);
        ctx.fillRect(445, 130, 10, 15);
        ctx.fillRect(460, 130, 10, 15);

        // Macbeth standing on the battlements
        ctx.fillStyle = '#2c1e17';
        ctx.fillRect(385, 160, 15, 40); // Body
        ctx.fillStyle = '#ffe4c4';
        ctx.beginPath();
        ctx.arc(392, 150, 6, 0, Math.PI*2);
        ctx.fill();

        // Crown on Macbeth's head
        if (!act5State.crownFallen) {
            if (images.crown.complete && images.crown.naturalWidth !== 0) {
                ctx.drawImage(images.crown, act5State.crownX - 10, act5State.crownY - 8, 20, 16);
            } else {
                ctx.fillStyle = '#d4af37';
                ctx.beginPath();
                ctx.moveTo(act5State.crownX - 8, act5State.crownY);
                ctx.lineTo(act5State.crownX - 5, act5State.crownY - 10);
                ctx.lineTo(act5State.crownX, act5State.crownY - 4);
                ctx.lineTo(act5State.crownX + 5, act5State.crownY - 10);
                ctx.lineTo(act5State.crownX + 8, act5State.crownY);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Falling crown physics
        if (act5State.woodAdvance >= 90 && !act5State.crownFallen) {
            act5State.crownFallen = true;
            act5State.crownVelY = -2; // Bounce up initially
            act5State.crownVelX = -1.8; // Roll left
        }

        if (act5State.crownFallen) {
            act5State.crownY += act5State.crownVelY;
            act5State.crownX += act5State.crownVelX;
            act5State.crownVelY += 0.25; // gravity
            act5State.crownAngle += 0.08;

            if (act5State.crownY > 375) {
                act5State.crownY = 375; // Hit floor
                act5State.crownVelY = 0;
                act5State.crownVelX = 0;
            }

            ctx.save();
            ctx.translate(act5State.crownX, act5State.crownY);
            ctx.rotate(act5State.crownAngle);
            if (images.crown.complete && images.crown.naturalWidth !== 0) {
                ctx.drawImage(images.crown, -10, -8, 20, 16);
            } else {
                ctx.fillStyle = '#d4af37';
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(-5, -10);
                ctx.lineTo(0, -4);
                ctx.lineTo(5, -10);
                ctx.lineTo(8, 0);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Hill ground
        ctx.fillStyle = '#1e2417';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        ctx.lineTo(320, 380);
        ctx.lineTo(500, 400);
        ctx.closePath();
        ctx.fill();

        // Birnam Wood Trees
        // They march from bottom (Y: 380) up the hill (Y: 280) based on woodAdvance
        let startY = 390;
        let targetY = 240;
        let currentY = startY - (act5State.woodAdvance / 100) * (startY - targetY);

        ctx.fillStyle = '#1b4d22'; // Dark green leaves
        ctx.strokeStyle = '#0d2b12';
        ctx.lineWidth = 1.5;

        // Draw multiple rows of moving trees (soldiers holding branches)
        const drawTree = (tx, ty, tscale) => {
            ctx.save();
            ctx.translate(tx, ty);
            ctx.scale(tscale, tscale);
            
            // Trunk
            ctx.fillStyle = '#4a321a';
            ctx.fillRect(-3, 0, 6, 20);

            // Foliage (overlapping triangles)
            ctx.fillStyle = '#1b4d22';
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(-15, 0);
            ctx.lineTo(15, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, -38);
            ctx.lineTo(-11, -12);
            ctx.lineTo(11, -12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Soldier helmet sticking out slightly under the branch
            ctx.fillStyle = '#7a7a7a';
            ctx.beginPath();
            ctx.arc(-2, 10, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        // Render forest rows
        for (let row = 0; row < 3; row++) {
            let rowOffset = row * 15;
            let treeCount = 7 - row;
            for (let i = 0; i < treeCount; i++) {
                let tx = 40 + i * 50 + (row * 25) + Math.sin(time * 0.05 + i) * 3;
                let ty = currentY + rowOffset;
                // Bound check: trees should not go above the castle ramparts
                if (tx > 320 && ty < 230) {
                    ty = 230 + rowOffset;
                }
                drawTree(tx, ty, 0.9 - row * 0.1);
            }
        }

        // Draw text indicators for Macbeth's panic
        if (act5State.woodAdvance >= 80) {
            ctx.fillStyle = '#ff3333';
            ctx.font = "bold 13px 'MedievalSharp', cursive";
            ctx.fillText("THE WOOD IS MOVING!", 310, 100);
        }
        if (act5State.woodAdvance === 100) {
            ctx.fillStyle = '#fff';
            ctx.font = "italic 11px Georgia";
            ctx.fillText("Yield thee, coward!", 210, 180);
        }
    }

    // 6. Launch animation
    switchAct(1);
    updateAndDraw();
});
