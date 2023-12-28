const canvas = document.getElementById("myCanvas");
const forgroundCtx = canvas.getContext("2d");

// Create a back buffer
let backBuffer = document.createElement("canvas");
let ctx = backBuffer.getContext("2d");

let audioCtx = null;
let oscillator = null;
let gain = null;
let gameState = "notstarted";

const theme = "clean";

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
  const { height, width } = window.visualViewport;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  backBuffer.width = width;
  backBuffer.height = height;
  resetBoard();
};

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (!window.visualViewport) {
      return;
    }
    resizeCanvas();
  }, 200);
});

const fontSize = 20;

const levels = [
  { speed: 10, letters: ["A", "S", "D", "F", "G"] },
  { speed: 15, letters: ["H", "J", "K", "L"] },
  {
    speed: 20,
    letters: ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  },
  {
    speed: 25,
    letters: ["Q", "W", "E", "R", "T", "A", "S", "D", "F", "G"],
  },
  {
    speed: 30,
    letters: ["Y", "U", "I", "O", "P", "H", "J", "K", "L"],
  },
  {
    speed: 100,
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
  },
  {
    speed: 200,
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
  },
];

let level = levels[0];
let score = 0;

const openKeyboard = () => {
  document.getElementById("input").focus();
  setTimeout(() => {
    resizeCanvas();
  }, 1000);
};

const getRandomLetter = () =>
  level.letters[Math.floor(Math.random() * level.letters.length)];

let board = [];
let activeCols = [];

const getRandomIndex = () => Math.floor(Math.random() * board[0].length);

const addActiveCol = (i = 0) => {
  if (i > 2) return;
  const randomIndex = getRandomIndex();
  const already = activeCols.find((col) => col.x == randomIndex);
  if (already) {
    return addActiveCol(i + 1);
  } else {
    activeCols.push({ letter: board[0][randomIndex], x: randomIndex, y: 0 });
  }
};

const updateActiveCols = () => {
  const filledScreen = activeCols.filter((col) => col.y < board.length - 1);
  if (activeCols.length === board[0].length && filledScreen.length === 0) {
    gameState = "gameover";
    return;
  }
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
  });
};

const resetBoard = (nextLevel) => {
  board = Array(Math.floor(canvas.height / fontSize))
    .fill("")
    .map(() => Array(Math.floor(canvas.width / fontSize)).fill(""));

  for (const col in board[0]) {
    board[0][col] = getRandomLetter();
  }

  if (nextLevel) {
    console.log("next level", level);
    const index = levels.findIndex((l) => l.speed === level.speed);
    if (levels[index + 1]) {
      level = levels[index + 1];
    } else {
      level.speed += 10;
    }
  }
};

resetBoard();

let offset = fontSize;

const setupCanvas = () => {
  // Clear and draw on the back buffer
  ctx.clearRect(0, 0, backBuffer.width, backBuffer.height);

  // background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, backBuffer.width, backBuffer.height);
  ctx.fillStyle = "green";
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  forgroundCtx.fillStyle = "white";
  forgroundCtx.font = `48px Arial`;
  forgroundCtx.textAlign = "center";
  forgroundCtx.textBaseline = "middle";
};

const drawBoard = () => {
  for (const row in board) {
    for (const col in board[row]) {
      const letter = board[row][col];
      if (letter) {
        let x = fontSize + col * fontSize;
        ctx.fillText(letter, x, row * fontSize);
      }
    }
  }
};

resizeCanvas();

setInterval(() => {
  setupCanvas();
  if (gameState !== "started") {
    let text = "Click here to start";
    if (gameState === "gameover") {
      text = "Game over";
    }
    forgroundCtx.fillText(text, canvas.width / 2, canvas.height / 2);
    return;
  }

  if (Math.random() < 0.15 || activeCols.length === 0) {
    addActiveCol();
  }

  updateActiveCols();

  drawBoard();
  // Swap buffers
  forgroundCtx.drawImage(backBuffer, 0, 0);
}, 800 - level.speed * 60);

const startGame = () => {
  gameState = "started";

  level = levels[0];
  resetBoard();
  activeCols = [];
  const isTouchDevice = "ontouchstart" in document.documentElement;
  if (isTouchDevice) {
    openKeyboard();
  }
};

document.addEventListener("touchstart", startGame);
document.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  const { key } = event;

  if (!activeCols[0]) return console.log("no active cols");

  if (activeCols[0].letter === key.toUpperCase()) {
    const activeCol = activeCols.shift();
    for (const row in board) {
      if (row == 0) continue;
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
    console.log("wrong key", activeCols[0].letter, key.toUpperCase());
  }
});
