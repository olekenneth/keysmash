// Link to GitHub repository
// For more information, visit: https://github.com/olekenneth/keysmash

// Please be aware that this project is licensed under the GPLv3 license.
// Make sure to review the license terms before using or distributing the code.

const canvas = document.getElementById("myCanvas");
const forgroundCtx = canvas.getContext("2d");

// Create a back buffer
let backBuffer = document.createElement("canvas");
let ctx = backBuffer.getContext("2d");

let audioCtx = null;
let oscillator = null;
let gain = null;
let gameState = "notstarted";
let boardHeight = 0;
let boardWidth = 0;
let boardCols = 0;
let boardRows = 0;

const fontSize = 20;

let activeCols = [];
let board = [];
let score = 0;

const search = new URLSearchParams(window.location.search);
const theme = search.has("theme") ? search.get("theme") : "clean";

const playFrequency = async (frequency, type) => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (!type) type = "sine";
  oscillator = audioCtx.createOscillator();
  gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.connect(gain);
  oscillator.frequency.value = frequency;
  gain.connect(audioCtx.destination);
  oscillator.start(0);

  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 140);
  });
};

const resizeCanvas = () => {
  const { innerHeight, innerWidth } = window;

  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  backBuffer.width = innerWidth;
  backBuffer.height = innerHeight;
  resetBoard();
};

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 200);
});

const levels = [
  { speed: 10, letters: ["A", "S", "D", "F", "G"], number: 1 },
  { speed: 15, letters: ["H", "J", "K", "L"], number: 2 },
  {
    speed: 25,
    letters: ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    number: 3,
  },
  {
    speed: 35,
    letters: ["Q", "W", "E", "R", "T", "A", "S", "D", "F", "G"],
    number: 4,
  },
  {
    speed: 50,
    letters: ["Y", "U", "I", "O", "P", "H", "J", "K", "L"],
    number: 5,
  },
  {
    speed: 70,
    letters: [
      "Q",
      "W",
      "E",
      "R",
      "T",
      "A",
      "S",
      "D",
      "F",
      "G",
      "Y",
      "U",
      "I",
      "O",
      "P",
      "H",
      "J",
      "K",
      "L",
    ],
    number: 6,
  },
  {
    speed: 40,
    letters: [
      "[",
      "]",
      "{",
      "}",
      "$",
      "#",
      "'",
      "!",
      "?",
      ";",
      ":",
      "=",
      "*",
      "%",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
    ],
    number: 7,
  },
  {
    speed: 70,
    letters: [
      "Z",
      "X",
      "C",
      "V",
      "B",
      "N",
      "M",
      "Q",
      "W",
      "E",
      "R",
      "T",
      "A",
      "S",
      "D",
      "F",
      "G",
      "Y",
      "U",
      "I",
      "O",
      "P",
      "H",
      "J",
      "K",
      "L",
    ],
    number: 8,
  },
];

let level = levels[0];

const openKeyboard = () => {
  document.getElementById("input").focus();
  setTimeout(() => {
    resizeCanvas();
  }, 1000);
};

const getRandomLetter = () =>
  level.letters[Math.floor(Math.random() * level.letters.length)];

const getRandomIndex = () => {
  const cols = Array.from(board[0]).map((_, index) => index);
  const activeX = activeCols.map((col) => col.x);
  const notActive = Array.from(cols).filter(
    (_, index) => !activeX.includes(index)
  );

  return notActive[Math.floor(Math.random() * notActive.length)];
};

const addActiveCol = () => {
  const randomIndex = getRandomIndex();
  if (randomIndex !== undefined) {
    activeCols.push({
      letter: getRandomLetter(),
      locked: false,
      x: randomIndex,
      y: 0,
    });
  }
};

const updateActiveCols = () => {
  activeCols.forEach((col) => {
    const max = col.y + 1;
    for (let row = 0; row < max; row++) {
      if (board[row]) {
        let letter = col.letter;
        if (theme === "matrix" && row !== col.y) {
          letter = getRandomLetter();
        }
        board[row][col.x] = letter;
      }
    }

    if (board[max]) {
      col.y = max;
    }

    if (max === board.length) {
      col.locked = true;
    }
  });
};

const resetBoard = (nextLevel) => {
  const { height, width } = window.visualViewport;

  boardCols = Math.min(Math.floor(height / fontSize) - 1, 29);
  boardRows = Math.min(Math.floor(width / fontSize), 29);
  boardHeight = boardCols * fontSize;
  boardWidth = boardRows * fontSize;

  board = Array(Math.floor(boardCols))
    .fill("")
    .map(() => Array(boardRows).fill(""));

  if (nextLevel) {
    console.log("next level", level);
    const firstLockedCol = activeCols.filter((col) => col.locked)[0];
    activeCols = activeCols.filter((col) => col !== firstLockedCol);
    const index = levels.findIndex((l) => l === level);
    if (levels[index + 1]) {
      level = levels[index + 1];
    } else {
      level.speed += 10;
      level.number += 1;
    }
  }
};

resetBoard();

const setupCanvas = () => {
  // Clear and draw on the back buffer
  ctx.clearRect(0, 0, backBuffer.width, backBuffer.height);

  // background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, backBuffer.width, backBuffer.height);
  ctx.fillStyle = "green";

  ctx.strokeStyle = "green";
  ctx.strokeRect(
    backBuffer.width / 2 - boardWidth / 2,
    5,
    boardWidth + 4,
    boardHeight + 5
  );
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  forgroundCtx.fillStyle = "white";
  forgroundCtx.font = `48px Arial`;
  forgroundCtx.textAlign = "center";
  forgroundCtx.textBaseline = "middle";
};

const drawScore = () => {
  ctx.fillStyle = "green";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    `Score: ${score}. Level: ${level.number}`,
    backBuffer.width / 2 - boardWidth / 2,
    boardHeight + fontSize + 15
  );
};

const drawBoard = () => {
  for (const row in board) {
    for (const col in board[row]) {
      const letter = board[row][col];
      if (letter) {
        let x =
          backBuffer.width / 2 - boardWidth / 2 + fontSize + col * fontSize;
        ctx.fillText(letter, x, 8 + fontSize + row * fontSize);
      }
    }
  }
  drawScore();
};

resizeCanvas();

const gameLoop = () => {
  const minSpeed = 120;
  const maxSpeed = 300;
  let speed = maxSpeed - (maxSpeed - minSpeed) * (level.speed / 100);
  if (speed < minSpeed) {
    speed = minSpeed;
  }
  setTimeout(gameLoop, speed);

  setupCanvas();
  if (gameState !== "started") {
    let text = "Ready?";
    if (gameState === "gameover") {
      text = "Game over";
    }
    forgroundCtx.fillText(text, canvas.width / 2, boardHeight / 2);
    forgroundCtx.font = `26px Arial`;

    forgroundCtx.fillText(
      "Click to start",
      canvas.width / 2,
      boardHeight / 2 + 48
    );
    return;
  }

  if (
    Math.random() < 0.15 ||
    activeCols.filter((col) => !col.locked).length === 0
  ) {
    addActiveCol();
  }

  updateActiveCols();

  drawBoard();

  const filledScreen = activeCols.filter((col) => col.locked);
  if (filledScreen.length === board[0].length) {
    gameState = "gameover";
  }

  // Swap buffers
  forgroundCtx.drawImage(backBuffer, 0, 0);
};

gameLoop();

const startGame = () => {
  if ("ontouchstart" in document.documentElement) {
    openKeyboard();
  }
  if (gameState === "started") return;
  gameState = "started";

  level = levels[0];
  resetBoard();
  activeCols = [];
  score = 0;
};

const keyPressed = (key) => {
  const activeCol = activeCols.filter((col) => !col.locked)[0];
  if (!activeCol) return console.log("no active cols");

  if (activeCol.letter === key.toUpperCase()) {
    activeCols = activeCols.filter((col) => col !== activeCol);
    for (const row in board) {
      board[row][activeCol.x] = "";
    }

    score++;
    playFrequency(440, "sine");
    if (score === level.speed) {
      resetBoard(true);
    }
  } else {
    playFrequency(87.31, "triangle");

    console.log(board);
    console.log(activeCols);
    console.log("wrong key", activeCol.letter, key.toUpperCase());
  }
};

document.addEventListener("touchstart", startGame);
document.addEventListener("click", startGame);

document.getElementById("input").addEventListener("input", (event) => {
  event.preventDefault();

  const key = document.getElementById("input").value.slice(-1);

  if (key) {
    keyPressed(key);
  }
});

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  let { key } = event;

  if (key) {
    keyPressed(key);
  }
});
