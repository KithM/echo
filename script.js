// DIFFICULTY SETTINGS

const difficulties = {
    Easy: {
        minGrid: 2,
        maxGrid: 3,
        minPattern: 2,
        maxPattern: 7,
        repScaling: 0.8,
        flashDuration: 450,
        flashDelay: 220
    },
    Normal: {
        minGrid: 2,
        maxGrid: 4,
        minPattern: 2,
        maxPattern: 9,
        repScaling: 1.0,
        flashDuration: 400,
        flashDelay: 200
    },
    Hard: {
        minGrid: 3,
        maxGrid: 5,
        minPattern: 3,
        maxPattern: 12,
        repScaling: 1.4,
        flashDuration: 300,
        flashDelay: 160
    },
    Impossible: {
        minGrid: 3,
        maxGrid: 6,
        minPattern: 4,
        maxPattern: 20,
        repScaling: 1.5,
        flashDuration: 140,
        flashDelay: 100
    }
};

let selectedDifficulty = 'Normal';
const config = difficulties[selectedDifficulty];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let gridSize = config.minGrid;
let patternLength = config.minPattern;
let pattern = [];
let userInput = [];
let level = 1;
let score = 0;
let isPlayerTurn = false;

const scoreDisplay = document.getElementById('score');
const gridContainer = document.getElementById('grid-container');
const levelDisplay = document.getElementById('level');
const gridSizeDisplay = document.getElementById('grid-size');
const patternLengthDisplay = document.getElementById('pattern-length');
const message = document.getElementById('message');
const startButton = document.getElementById('start-button');

//startButton.addEventListener('click', startLevel);
startButton.addEventListener('click', () => {
    const difficultySelect = document.getElementById('difficulty-select');
    selectedDifficulty = difficultySelect.value;
    Object.assign(config, difficulties[selectedDifficulty]);

    gridSize = config.minGrid;
    //patternLength = 2;
    patternLength = config.minPattern;
    level = 1;
    score = 0;
    currentReps = 0;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    gridSizeDisplay.textContent = `${gridSize}x${gridSize}`;
    patternLengthDisplay.textContent = patternLength;

    startLevel();
});

function startLevel() {
    message.textContent = '';
    userInput = [];

    generateGrid(gridSize);
    generatePattern();
    displayPattern();
}

function generateGrid(size) {
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i;
        tile.addEventListener('click', handleTileClick);
        gridContainer.appendChild(tile);
    }
}

function generatePattern() {
    pattern = [];
    const totalTiles = gridSize * gridSize;
    while (pattern.length < patternLength) {
        const rand = Math.floor(Math.random() * totalTiles);
        pattern.push(rand);
    }
}

function displayPattern() {
    const tiles = document.querySelectorAll('.tile');
    let i = 0;
    isPlayerTurn = false;

    const flashTile = (index) => {
        if (index >= pattern.length) {
            message.textContent = 'Your turn!';
            isPlayerTurn = true;
            return;
        }

        const tileIndex = pattern[index];
        const tile = tiles[tileIndex];

        tile.classList.add('flash');
        playTone(tileIndex, config.flashDuration);

        setTimeout(() => {
            tile.classList.remove('flash');
            setTimeout(() => flashTile(index + 1), config.flashDelay);
        }, config.flashDuration);
    };

    flashTile(0);
}

function handleTileClick(e) {
    if (!isPlayerTurn) return;

    const index = parseInt(e.target.dataset.index);
    const tile = e.target;
    playTone(index, config.flashDuration);

    tile.classList.add('active');
    setTimeout(() => tile.classList.remove('active'), 300);

    userInput.push(index);
    const current = userInput.length - 1;

    if (index !== pattern[current]) {
        tile.classList.add('wrong');
        setTimeout(() => tile.classList.remove('wrong'), 400);

        message.textContent = 'Incorrect! Try again.';
        userInput = [];
        isPlayerTurn = false;
        setTimeout(displayPattern, 1000);
        return;
    }

    if (userInput.length === pattern.length) {
        message.textContent = 'Correct!';
        isPlayerTurn = false;
        setTimeout(nextLevel, 1000);
    }
}

let currentReps = 0;

function nextLevel() {
    level++;
    //score++;
    //score += Math.round(patternLength * gridSize * 0.3 + level * 0.1);
    score += Math.round(1 + config.repScaling * (level / 10));

    scoreDisplay.textContent = score;

    currentReps++;

    //const requiredReps = patternLength; // e.g. length 4 → needs 4 plays
    const requiredReps = Math.ceil(patternLength * config.repScaling);

    if (currentReps >= requiredReps) {
        currentReps = 0;
        //patternLength++;
        if (patternLength < config.maxPattern) {
            patternLength++;
        }

        const maxRounds = gridSize * gridSize;
        const totalLengthsUsed = patternLength - config.minPattern;

        if (totalLengthsUsed >= maxRounds || patternLength >= config.maxPattern) {
            if (gridSize < config.maxGrid) {
                gridSize++;
                patternLength = config.minPattern;
            }
        }
    }

    // Update UI
    levelDisplay.textContent = level;
    gridSizeDisplay.textContent = `${gridSize}x${gridSize}`;
    patternLengthDisplay.textContent = patternLength;

    startLevel();
}

// SOUND

function playTone(index, duration = 300) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume(); // Ensure it's active
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    const baseFreq = 220; // A3
    const step = 20;      // Frequency step per tile index
    oscillator.frequency.value = baseFreq + (index * step);
    oscillator.type = 'triangle';

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    oscillator.start();

    oscillator.stop(audioCtx.currentTime + duration / 1000);

    // Clean up oscillator after stopping
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

////

// function playTone(index, duration = 300) {
//     const context = new (window.AudioContext || window.webkitAudioContext)();
//     const oscillator = context.createOscillator();
//     const gainNode = context.createGain();

//     const baseFreq = 220; // A3
//     const step = 20; // Frequency step per tile index
//     oscillator.frequency.value = baseFreq + (index * step);

//     oscillator.type = 'triangle'; // can also try 'square', 'triangle', etc.
//     oscillator.connect(gainNode);
//     gainNode.connect(context.destination);
//     oscillator.start();

//     gainNode.gain.setValueAtTime(1, context.currentTime); // volume
//     oscillator.stop(context.currentTime + duration / 1000);
// }

