// ---------------- ELEMENTOS ----------------

const board = document.getElementById("board");
const shuffleBtn = document.getElementById("shuffleBtn");
const swapSound = document.getElementById("swapSound");
const winSound = document.getElementById("winSound");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("scoreDisplay");

// ---------------- VARIÁVEIS ----------------

let musicPlaying = false;
let gameActive = false;
let hardLevel = 0;
let draggedTileIndex = null;

const size = 4;
const total = size * size;

const images = [
  "images/thumbbig-1351027.webp",
  "images/thumbbig-1354305.webp",
  "images/serene-sunset-scene-featuring-sleeping-cat-balcony-surrounded-by-plants-books_1383414-2910.avif"
];

let currentImageIndex = 0;
let tiles = [];
let selectedTile = null;

let timer = 0;
let interval = null;
let timeLimit = 30;
let score = 0;

let selectedMode = "normal";
let playerNickname = "";

// ---------------- START GAME ----------------

window.startGame = function (mode) {

  hardLevel = 0;

  const nickInput = document.getElementById("nicknameInput");

  if (!nickInput.value.trim()) {
    alert("Digite seu nickname primeiro!");
    return;
  }

  playerNickname = nickInput.value.trim();
  selectedMode = mode;
  updateModeWarning();

  if (mode === "hard") {
    document.body.classList.add("hard-mode");
  } else {
    document.body.classList.remove("hard-mode");
  }

  currentImageIndex = Math.floor(Math.random() * images.length);

  document.getElementById("startScreen").style.display = "none";
  document.querySelector(".container").style.display = "block";

  configureTimer();

  if (selectedMode === "hard") {
    showPreviewThenStart();
  } else {
    init();
  }
};

// ---------------- CONFIG TIMER ----------------

function configureTimer() {

  if (selectedMode === "hard") {

    const baseTime = 90;
    const reduction = hardLevel * 10;

    timeLimit = baseTime - reduction;

    if (timeLimit < 40) {
      timeLimit = 40;
    }

  } else {
    timeLimit = 9999;
  }
}

// ---------------- INIT ----------------

function init() {
  tiles = [];
  for (let i = 0; i < total; i++) {
    tiles.push(i);
  }
  shuffle();
}

// ---------------- RENDER ----------------

function render() {

  board.innerHTML = "";

  tiles.forEach((num, index) => {

    const tile = document.createElement("div");
    tile.classList.add("tile");

    const row = Math.floor(num / size);
    const col = num % size;

    tile.style.backgroundImage = `url('${images[currentImageIndex]}')`;
    tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
    tile.style.backgroundPosition =
      `${col * (100 / (size - 1))}% ${row * (100 / (size - 1))}%`;

    // destaque da peça selecionada (clique)
    if (selectedTile === index) {
      tile.classList.add("selected");
    }

    // ---------------- CLIQUE NORMAL ----------------
    tile.addEventListener("click", () => handleClick(index));

    // ---------------- DRAG DESKTOP ----------------
    tile.setAttribute("draggable", true);

    tile.addEventListener("dragstart", () => {
      draggedTileIndex = index;
    });

    tile.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    tile.addEventListener("drop", () => {
      handleDragSwap(index);
    });

    // ---------------- TOUCH MOBILE ----------------
    tile.addEventListener("touchstart", () => {
      draggedTileIndex = index;
    });

    tile.addEventListener("touchend", (e) => {

      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );

      if (!targetElement) return;

      if (targetElement.classList.contains("tile")) {
        const tileElements = [...document.querySelectorAll(".tile")];
        const targetIndex = tileElements.indexOf(targetElement);
        handleDragSwap(targetIndex);
      }

    });

    board.appendChild(tile);
  });
}

// ---------------- CLICK ----------------

function handleClick(index) {

  if (!gameActive) return;

  if (selectedTile === null) {
    selectedTile = index;
  } else if (selectedTile === index) {
    selectedTile = null;
  } else {

    if (selectedMode === "hard" && !isAdjacent(selectedTile, index)) {
      selectedTile = null;
      render();
      return;
    }

    const first = selectedTile;
    const second = index;

    const tileElements = document.querySelectorAll(".tile");

    tileElements[first].style.transform = "scale(0.9)";
    tileElements[second].style.transform = "scale(0.9)";

    setTimeout(() => {

      [tiles[first], tiles[second]] =
        [tiles[second], tiles[first]];

      swapSound.currentTime = 0;
      swapSound.volume = 0.6;
      swapSound.play();

      selectedTile = null;
      render();
      checkWin();

    }, 150);
  }

  render();
}

// ---------------- SHUFFLE ----------------

shuffleBtn.addEventListener("click", shuffle);

function shuffle() {

  tiles.sort(() => Math.random() - 0.5);
  selectedTile = null;
  render();

  stopTimer();
  timerDisplay.textContent = "";

  gameActive = true;

  if (selectedMode === "hard") {
    startTimer();
  }
}

// ---------------- WIN ----------------

function checkWin() {

  if (tiles.every((val, i) => val === i)) {

    stopTimer();
    gameActive = false;

    winSound.currentTime = 0;
    winSound.volume = 0.8;
    winSound.play();

    if (selectedMode === "hard") {

      const timeSpent = timeLimit - timer;
      score += 100 + (timer * 5);

      scoreDisplay.textContent = `🔥 Pontuação: ${score}`;

      if (window.saveScoreOnline) {
        window.saveScoreOnline(playerNickname, timeSpent);
      }
    }

    const boardElement = document.querySelector(".board");

    boardElement.classList.add("win-effect");

    setTimeout(() => {
      boardElement.classList.remove("win-effect");
      document.getElementById("winScreen").style.display = "flex";
    }, 800);
  }
}

// ---------------- CONTINUE AFTER WIN ----------------

function continueGame() {
  document.getElementById("winScreen").style.display = "none";
  nextPuzzle();
}

// ---------------- NEXT PUZZLE ----------------

function nextPuzzle() {

  const boardElement = document.querySelector(".board");

  // 🔥 ESCONDE A TELA DE VITÓRIA
  const winScreen = document.getElementById("winScreen");
  if (winScreen) {
    winScreen.style.display = "none";
  }

  boardElement.classList.add("fade-out");

  setTimeout(() => {

    hardLevel++;

    currentImageIndex++;
    if (currentImageIndex >= images.length) {
      currentImageIndex = 0;
    }

    configureTimer();
    boardElement.classList.remove("fade-out");

    if (selectedMode === "hard") {
      showPreviewThenStart();
    } else {
      init();
    }

  }, 400);
}


// ---------------- TIMER ----------------

function startTimer() {

  timer = timeLimit;
  timerDisplay.textContent = `⏱️ ${timer}s`;

  clearInterval(interval);

  interval = setInterval(() => {

    timer--;
    timerDisplay.textContent = `⏱️ ${timer}s`;

    if (timer <= 0) {
      clearInterval(interval);
      gameOver();
    }

  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
}

// ---------------- GAME OVER ----------------

function gameOver() {

  gameActive = false;
  stopTimer();

  if (musicPlaying) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    musicToggle.textContent = "🎵 Música: OFF";
    musicPlaying = false;
  }

  const loseSound = new Audio("audio/lose.mp3");
  loseSound.volume = 0.8;
  loseSound.play();

  document.getElementById("loseScreen").style.display = "flex";
}

// ---------------- RESTART ----------------

function restartGame() {

  document.getElementById("loseScreen").style.display = "none";

  score = 0;
  scoreDisplay.textContent = "";
  stopTimer();

  if (selectedMode === "hard") {
    showPreviewThenStart();
  } else {
    init();
  }
}

// ---------------- MENU ----------------

function goToMenu() {

  hardLevel = 0;

  document.getElementById("loseScreen").style.display = "none";
  document.getElementById("previewScreen").style.display = "none";
  document.getElementById("winScreen").style.display = "none";

  stopTimer();

  score = 0;
  scoreDisplay.textContent = "";
  timerDisplay.textContent = "";

  gameActive = false;

  document.querySelector(".container").style.display = "none";
  document.getElementById("startScreen").style.display = "flex";
}

// ---------------- PREVIEW ----------------

function showPreviewThenStart() {

  const preview = document.getElementById("previewScreen");
  const previewImg = document.getElementById("previewImage");

  previewImg.src = images[currentImageIndex];
  preview.style.display = "flex";

  setTimeout(() => {
    preview.style.display = "none";
    init();
  }, 5000);
}

// ---------------- UTILS ----------------

function isAdjacent(i1, i2) {

  const row1 = Math.floor(i1 / size);
  const col1 = i1 % size;
  const row2 = Math.floor(i2 / size);
  const col2 = i2 % size;

  return (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1);
}

// ---------------- MUSIC ----------------
function handleDragSwap(targetIndex) {

  if (!gameActive) return;
  if (draggedTileIndex === null) return;
  if (draggedTileIndex === targetIndex) return;

  if (selectedMode === "hard" && !isAdjacent(draggedTileIndex, targetIndex)) {
    draggedTileIndex = null;
    return;
  }

  const first = draggedTileIndex;
  const second = targetIndex;

  const tileElements = document.querySelectorAll(".tile");

  tileElements[first].style.transform = "scale(0.9)";
  tileElements[second].style.transform = "scale(0.9)";

  setTimeout(() => {

    [tiles[first], tiles[second]] =
      [tiles[second], tiles[first]];

    swapSound.currentTime = 0;
    swapSound.volume = 0.6;
    swapSound.play();

    draggedTileIndex = null;
    render();
    checkWin();

  }, 150);
}
function updateModeWarning() {

  const warning = document.getElementById("modeWarning");

  if (!warning) return;

  if (selectedMode === "hard") {
    warning.textContent =
      "⚠️ Modo Difícil: você só pode arrastar peças vizinhas.";
  } else {
    warning.textContent = "";
  }
}

musicToggle.addEventListener("click", () => {

  if (!musicPlaying) {
    bgMusic.volume = 0.4;
    bgMusic.play();
    musicToggle.textContent = "🎵 Música: ON";
    musicPlaying = true;
  } else {
    bgMusic.pause();
    musicToggle.textContent = "🎵 Música: OFF";
    musicPlaying = false;
  }
});
