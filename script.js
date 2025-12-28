let running = false, isPaused = false, currentPhase = 0, timeLeft = 0;

const circle = document.getElementById('circle');
const timerDisplay = document.getElementById('timer-display');
const statusText = document.getElementById('status');
const mainBtn = document.getElementById('mainBtn');

const sounds = {
    inhale: document.getElementById('snd-inhale'),
    exhale: document.getElementById('snd-exhale'),
    pause: document.getElementById('snd-pause')
};

function playSnd(key) {
    if (sounds[key]) {
        sounds[key].currentTime = 0;
        sounds[key].play().catch(() => {});
    }
}

['inhale', 'holdFull', 'exhale', 'holdEmpty'].forEach((id, i) => {
    document.getElementById(id).oninput = function() {
        document.getElementById('v' + (i+1)).innerText = this.value;
    };
});

function setPreset(inT, hF, exT, hE, name) {
    document.getElementById('inhale').value = inT;
    document.getElementById('holdFull').value = hF;
    document.getElementById('exhale').value = exT;
    document.getElementById('holdEmpty').value = hE;
    for(let i=1; i<=4; i++) document.getElementById('v'+i).innerText = [inT, hF, exT, hE][i-1];
    statusText.innerText = name;
}

async function loop() {
    const phases = [
        { n: "Inhale", s: 1.8, id: 'inhale', k: 'inhale' },
        { n: "Hold", s: 1.8, id: 'holdFull', k: 'pause' },
        { n: "Exhale", s: 1, id: 'exhale', k: 'exhale' },
        { n: "Pause", s: 1, id: 'holdEmpty', k: 'pause' }
    ];

    while (running) {
        for (let i = currentPhase; i < 4; i++) {
            if (!running) break;
            currentPhase = i;
            let dur = parseInt(document.getElementById(phases[i].id).value);
            
            // Skip phase if duration is 0
            if (dur === 0) continue;

            statusText.innerText = phases[i].n;
            circle.style.transition = `transform ${dur}s linear`;
            circle.style.transform = `scale(${phases[i].s})`;
            playSnd(phases[i].k);

            timeLeft = timeLeft > 0 ? timeLeft : dur;
            while (timeLeft > 0) {
                if (!running) return;
                if (isPaused) {
                    circle.style.transition = "none";
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }
                timerDisplay.innerText = timeLeft;
                await new Promise(r => setTimeout(r, 1000));
                timeLeft--;
            }
            timeLeft = 0;
        }
        currentPhase = 0;
    }
}

mainBtn.onclick = () => {
    if (!running) {
        running = true; isPaused = false;
        mainBtn.innerText = "PAUSE";
        loop();
    } else {
        isPaused = !isPaused;
        mainBtn.innerText = isPaused ? "RESUME" : "PAUSE";
    }
};

document.getElementById('resetBtn').onclick = () => {
    running = false; isPaused = false; currentPhase = 0; timeLeft = 0;
    timerDisplay.innerText = "0";
    statusText.innerText = "Ready";
    circle.style.transition = "0.5s";
    circle.style.transform = "scale(1)";
    mainBtn.innerText = "START";
};

// Volume Control
const volSlider = document.getElementById('volSlider');
const muteBtn = document.getElementById('muteBtn');
volSlider.oninput = (e) => Object.values(sounds).forEach(s => s.volume = e.target.value);
muteBtn.onclick = () => {
    const isMuted = sounds.inhale.muted = !sounds.inhale.muted;
    sounds.exhale.muted = sounds.pause.muted = isMuted;
    muteBtn.innerText = isMuted ? "🔇" : "🔊";
};

// Screen Wake Lock Variable
let wakeLock = null;

// Function to keep screen on
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen Wake Lock is active');
            
            // Agar lock khatam ho jaye (e.g. tab switch karne par), to dobara mangen
            wakeLock.addEventListener('release', () => {
                console.log('Screen Wake Lock was released');
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

// Jab Start button dabe, tab screen lock active ho
const originalStart = mainBtn.onclick;
mainBtn.onclick = () => {
    originalStart(); // Purana logic chale
    if (running) {
        requestWakeLock();
    }
};

// Jab page dobara visible ho (tab wapis aane par), lock re-activate karein
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
});