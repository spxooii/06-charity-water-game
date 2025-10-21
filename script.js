// Elements
const startBtn = document.getElementById('start-btn');
const playAgainBtn = document.getElementById('play-again');
const gameScreen = document.getElementById('game-screen');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const cells = Array.from(document.querySelectorAll('.cell'));
const scoreDisplay = document.getElementById('score');
const impactDisplay = document.getElementById('impact');
const timerFill = document.getElementById('timer-fill');
const factBox = document.getElementById('fact-box');
const highestTileDisplay = document.getElementById('highest-tile');

// Modal
const howToBtn = document.getElementById('how-to-play-btn');
const modal = document.getElementById('how-to-play');
const closeModal = document.getElementById('close-modal');

// Game Variables
const size = 4;
let board = [];
let score = 0;

let timer = 60;
let timerInterval = null;

const difficulty = {
  easy: { seconds: 90, label: "Easy" },
  normal: { seconds: 60, label: "Normal" },
  hard: { seconds: 40, label: "Hard" }
};

// Current mode + timer state
let currentDifficulty = "normal";
let maxTime = difficulty[currentDifficulty].seconds; // for % bar
let timeLeft = maxTime;

let shownContainers = [];

const tileOrder = ["Cup", "Bottle", "Bucket", "JerryCan", "Well", "Pump", "Pipeline"];
let highestContainer = "Cup";

// Container-aligned facts
const containerFacts = {
  "Cup": "💡 Many people around the world fetch water in cups every day.",
  "Bottle": "💡 Bottled water is expensive and not always sustainable.",
  "Bucket": "💡 Buckets help carry water over long distances.",
  "JerryCan": "💡 Jerrycans hold larger amounts safely for families.",
  "Well": "💡 Wells provide communities with cleaner water nearby.",
  "Pump": "💡 Pumps make accessing groundwater faster and easier.",
  "Pipeline": "💡 Pipelines deliver water to entire villages efficiently and safely!"
};

// Charity: water milestone facts
const charityFacts = [
  "🌍 703 million people still lack access to clean water.",
  "⏳ Every day, women and girls spend 200 million hours collecting water.",
  "📚 Clean water keeps kids in school, especially girls.",
  "💰 Every $1 invested in water provides a $4.30 economic return.",
  "🚰 Eight out of ten people without improved water live in rural areas."
];

// Event Listeners
startBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

// Modal logic
howToBtn.addEventListener('click', () => modal.style.display = 'block');
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

// Keyboard input
document.addEventListener('keydown', e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    move(e.key.replace("Arrow", "").toLowerCase());
  }
});

// Mobile swipe support
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});
document.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
  else move(dy > 0 ? "down" : "up");
});

// Game Functions
function startGame() {
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  endScreen.style.display = 'none';

  score = 0;
  const selected = document.querySelector('input[name="difficulty"]:checked');
  currentDifficulty = selected ? selected.value : 'normal';
  maxTime = difficulty[currentDifficulty].seconds;
  timer = maxTime;

  // Show the mode in the HUD
  const diffLabel = document.getElementById('difficulty-label');
  if (diffLabel) diffLabel.textContent = `Mode: ${difficulty[currentDifficulty].label}`;
  shownContainers = []; // reset array

  // Initialize empty board
  board = Array(size).fill().map(() => Array(size).fill(null));

  addNewTile();
  addNewTile();
  drawBoard();
  startTimer();
}

// Draw board and Heads-Up Display (HUD)
function drawBoard() {
  let index = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const currentTile = board[r][c];
      const cell = cells[index];
      cell.textContent = currentTile || "";
      cell.className = 'cell';
      if (currentTile) {
        cell.classList.add(currentTile);
      }
      index++;
    }
  }

  scoreDisplay.textContent = `Score: ${score}`;
  impactDisplay.textContent = `People Served: ${Math.floor(score / 100)}`;
  highestTileDisplay.textContent = `Highest Container: ${highestContainer}`;

  // Update timer fill
  const pct = (timer / maxTime) * 100;
  timerFill.style.width = pct + "%";
}

// Add a new "Cup" tile in a random empty cell
function addNewTile() {
  const emptyCells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!board[r][c]) emptyCells.push({ r, c });

  if (!emptyCells.length) return;

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[r][c] = "Cup";
}

// Countdown timer
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    drawBoard();
    if (timer <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

// Move tiles in a direction
function move(direction) {
  function slide(line) {
    const newLine = [];
    for (let i = 0; i < line.length; i++) {
      const current = line[i];
      if (!current) continue;
      if (newLine.length && newLine[newLine.length - 1] === current) {
        const nextLevel = tileOrder[tileOrder.indexOf(current) + 1];
        if (nextLevel) {
          newLine[newLine.length - 1] = nextLevel;
          score += 10; // simple scoring
          showFact(nextLevel);
          updateHighestContainer(nextLevel);
        }
      } else {
        newLine.push(current);
      }
    }
    while (newLine.length < size) newLine.push(null);
    return newLine;
  }

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < size; r++) {
      let row = [...board[r]];
      if (direction === "right") row.reverse();
      row = slide(row);
      if (direction === "right") row.reverse();
      board[r] = row;
    }
  } else {
    for (let c = 0; c < size; c++) {
      let col = [];
      for (let r = 0; r < size; r++) col.push(board[r][c]);
      if (direction === "down") col.reverse();
      col = slide(col);
      if (direction === "down") col.reverse();
      for (let r = 0; r < size; r++) board[r][c] = col[r];
    }
  }

  addNewTile();
  drawBoard();

  if (!hasMovesLeft()) {
    clearInterval(timerInterval);
    endGame();
  }
}

// Show container-aligned or charity fact
function showFact(tile) {
  let fact;
  if (!shownContainers.includes(tile)) {
    fact = containerFacts[tile];      // first time: container fact
    shownContainers.push(tile);       // mark as shown
  } else if (["Well", "Pump", "Pipeline"].includes(tile)) {
    fact = charityFacts[Math.floor(Math.random() * charityFacts.length)]; // milestone fact
  } else {
    fact = `You merged a ${tile}! Keep going!`; // repeated merge
  }
  factBox.textContent = fact;
}

// Get the highest container on the board
function updateHighestContainer(tileName) {
  const currentIndex = tileOrder.indexOf(highestContainer);
  const newIndex = tileOrder.indexOf(tileName);
  if (newIndex > currentIndex) {
    highestContainer = tileName;
    document.querySelectorAll("#highest-tile").forEach(el => {
      el.textContent = `Highest Container: ${highestContainer}`;
    });
  }
}

function hasMovesLeft() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) return true;
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const t = board[r][c];
      if (!t) continue;
      if (c < size - 1 && board[r][c + 1] === t) return true; // right
      if (r < size - 1 && board[r + 1][c] === t) return true; // down
    }
  }
  return false;
}

// End the game
function endGame() {
  clearInterval(timerInterval);
  gameScreen.style.display = 'none';
  endScreen.style.display = 'block';
  document.getElementById('final-score').textContent = `Final Score: ${score}`;
  document.getElementById('final-impact').textContent = `People Served: ${Math.floor(score / 100)}`;
  highestTileDisplay.textContent = `Highest Container: ${highestContainer}`;
}



