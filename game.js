const canvas = document.getElementById("myCanvas");
const forgroundCtx = canvas.getContext("2d");

// Create a back buffer
let backBuffer = document.createElement("canvas");
let ctx = backBuffer.getContext("2d");

let audioCtx = null;
let oscillator = null;
let gain = null;
let gameState = "notstarted";

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
  resizeTimeout = setTimeout(resizeCanvas, 200);
});

const levels = [
  { speed: 10, letters: ["A", "S", "D", "F", "G"] },
  { speed: 15, letters: ["H", "J", "K", "L"] },
  {
    speed: 25,
    letters: ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  },
  {
    speed: 35,
    letters: ["Q", "W", "E", "R", "T", "A", "S", "D", "F", "G"],
  },
  {
    speed: 50,
    letters: ["Y", "U", "I", "O", "P", "H", "J", "K", "L"],
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

    if (max === board.length - 1) {
      col.locked = true;
    }
  });
};

const resetBoard = (nextLevel) => {
  board = Array(Math.floor(canvas.height / fontSize))
    .fill("")
    .map(() => Array(Math.floor(canvas.width / fontSize)).fill(""));

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

const gameLoop = () => {
  const minSpeed = 150;
  const maxSpeed = 300;
  const speed = maxSpeed - (maxSpeed - minSpeed) * (level.speed / 100);
  setTimeout(gameLoop, speed);

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

  const filledScreen = activeCols.filter((col) => col.locked);
  if (filledScreen.length === board[0].length) {
    gameState = "gameover";
  }

  // Swap buffers
  forgroundCtx.drawImage(backBuffer, 0, 0);
};

gameLoop();

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

const keyPressed = (key) => {
  const activeCol = activeCols.filter((col) => !col.locked)[0];
  if (!activeCol) return console.log("no active cols");

  if (activeCol.letter === key.toUpperCase()) {
    activeCols = activeCols.filter((col) => col !== activeCol);
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
