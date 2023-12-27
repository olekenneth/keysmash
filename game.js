const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let audioCtx = null;
let oscillator = null;
let gain = null;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
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
];

let level = levels[0];
let score = 0;

const openKeyboard = () => {
  document.getElementById("input").focus();
};

const getRandomLetter = () =>
  level.letters[Math.floor(Math.random() * level.letters.length)];

let board = [];
let activeCols = [];

const getRandomIndex = () => Math.floor(Math.random() * board[0].length);

const addActiveCol = () => {
    const randomIndex = getRandomIndex();
    const already = activeCols.find((col) => col.x == randomIndex);
    if (already) {
	return addActiveCol();
    }

  activeCols.push({ letter: board[0][randomIndex], x: randomIndex, y: 0 });
};

const updateActiveCols = () => {
  activeCols.forEach((col) => {
    const max = col.y + 1;
      for(let row = 0; row < max; row++) {
	if (board[row]) {
	  board[row][col.x] = col.letter;
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

const setupCanvas = (ctx) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "green";
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
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


setInterval(() => {
  setupCanvas(ctx);

  if (Math.random() < 0.1 || activeCols.length === 0) {
    addActiveCol();
  }

  updateActiveCols();

  drawBoard();
}, 800 - level.speed * 60);

document.addEventListener("touchstart", openKeyboard);

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

    console.log("yey", score, level);
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

const playPopcorn = async () => {
  const notes = [65.41, 58.27, 65.41, 49.0, 38.89, 49.0, 32.7];

  for (const freq of notes) {
    await playFrequency(freq, "sine");
  }
  playPopcorn();
};
