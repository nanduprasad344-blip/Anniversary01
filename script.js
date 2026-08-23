const PUZZLES = [
  {
    image: "assets/puzzle-1.jpg",
    cols: 3, rows: 3,
    intro: "Let's start with something simple. ❤️",
    done: "Puzzle Complete ❤️"
  },
  {
    image: "assets/puzzle-2.jpg",
    cols: 4, rows: 3,
    intro: "One piece at a time...",
    done: "Another one complete. ❤️"
  },
  {
    image: "assets/puzzle-3.jpg",
    cols: 4, rows: 4,
    intro: "One last puzzle.",
    done: "You put every little piece back together. ❤️"
  }
];

const SNAP_DISTANCE = 55;
const TRAY_SIZE = 4;

let puzzleIndex = 0;
let placed = [];
let tray = [];
let pool = [];
let dragging = null;
let boardRect = null;

const board = document.getElementById("board");
const trayEl = document.getElementById("tray");
const progress = document.getElementById("progress");
const introOverlay = document.getElementById("introOverlay");
const doneOverlay = document.getElementById("doneOverlay");
const reward = document.getElementById("reward");
const introText = document.getElementById("introText");
const doneText = document.getElementById("doneText");
const beginBtn = document.getElementById("beginBtn");
const nextBtn = document.getElementById("nextBtn");
const questionsBtn = document.getElementById("questionsBtn");

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getBoardSize(p) {
  const width = Math.min(board.parentElement.clientWidth, 360);
  const ratio = p.rows / p.cols;
  return { width, height: width * ratio };
}

function startPuzzle() {
  const p = PUZZLES[puzzleIndex];
  placed = [];
  const order = shuffle(Array.from({length: p.cols * p.rows}, (_, i) => i));
  tray = order.slice(0, TRAY_SIZE);
  pool = order.slice(TRAY_SIZE);
  introOverlay.classList.add("hidden");
  doneOverlay.classList.add("hidden");
  render();
}

function render() {
  const p = PUZZLES[puzzleIndex];
  const size = getBoardSize(p);
  board.style.width = size.width + "px";
  board.style.height = size.height + "px";
  progress.textContent = `Puzzle ${puzzleIndex + 1} — ${placed.length} / ${p.cols * p.rows}`;

  board.innerHTML = "";

  // Empty board slots
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const id = r * p.cols + c;
      if (placed.includes(id)) continue;
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.left = (c * size.width / p.cols) + "px";
      cell.style.top = (r * size.height / p.rows) + "px";
      cell.style.width = (size.width / p.cols) + "px";
      cell.style.height = (size.height / p.rows) + "px";
      board.appendChild(cell);
    }
  }

  // Placed pieces
  placed.forEach(id => {
    const piece = makePiece(id, false);
    const r = Math.floor(id / p.cols);
    const c = id % p.cols;
    piece.style.left = (c * size.width / p.cols) + "px";
    piece.style.top = (r * size.height / p.rows) + "px";
    piece.style.width = (size.width / p.cols) + "px";
    piece.style.height = (size.height / p.rows) + "px";
    board.appendChild(piece);
  });

  renderTray();
}

function makePiece(id, draggable) {
  const p = PUZZLES[puzzleIndex];
  const size = getBoardSize(p);
  const cw = size.width / p.cols;
  const ch = size.height / p.rows;
  const r = Math.floor(id / p.cols);
  const c = id % p.cols;

  const el = document.createElement("div");
  el.className = "piece";
  el.dataset.id = id;
  el.style.width = cw + "px";
  el.style.height = ch + "px";

  const img = document.createElement("img");
  img.src = p.image;
  img.draggable = false;
  img.style.width = size.width + "px";
  img.style.height = size.height + "px";
  img.style.left = (-c * cw) + "px";
  img.style.top = (-r * ch) + "px";
  el.appendChild(img);

  if (draggable) attachDrag(el);
  return el;
}

function renderTray() {
  trayEl.innerHTML = "";
  tray.forEach(id => {
    const slot = document.createElement("div");
    slot.className = "slot";
    const piece = makePiece(id, true);
    slot.appendChild(piece);
    trayEl.appendChild(slot);
  });
}

function attachDrag(el) {
  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    const id = Number(el.dataset.id);
    dragging = { id, el };
    el.classList.add("dragging");
    el.setPointerCapture?.(e.pointerId);
    moveDrag(e);
  });

  el.addEventListener("pointermove", e => {
    if (!dragging || dragging.id !== Number(el.dataset.id)) return;
    e.preventDefault();
    moveDrag(e);
  });

  const end = e => {
    if (!dragging || dragging.id !== Number(el.dataset.id)) return;
    const id = dragging.id;
    dragging = null;
    el.classList.remove("dragging");
    tryPlace(id, e.clientX, e.clientY);
  };

  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function moveDrag(e) {
  if (!dragging) return;
  dragging.el.style.left = e.clientX + "px";
  dragging.el.style.top = e.clientY + "px";
}

function tryPlace(id, x, y) {
  const p = PUZZLES[puzzleIndex];
  const size = getBoardSize(p);
  boardRect = board.getBoundingClientRect();

  const r = Math.floor(id / p.cols);
  const c = id % p.cols;
  const targetX = boardRect.left + (c + .5) * size.width / p.cols;
  const targetY = boardRect.top + (r + .5) * size.height / p.rows;
  const dist = Math.hypot(x - targetX, y - targetY);

  if (dist <= SNAP_DISTANCE) {
    placed.push(id);
    tray = tray.filter(x => x !== id);
    if (pool.length) tray.push(pool.shift());
    render();

    if (placed.length === p.cols * p.rows) {
      setTimeout(showComplete, 500);
    }
  } else {
    render();
  }
}

function showComplete() {
  const p = PUZZLES[puzzleIndex];
  doneText.textContent = p.done;
  nextBtn.textContent = puzzleIndex < PUZZLES.length - 1 ? "NEXT PUZZLE" : "CONTINUE";
  doneOverlay.classList.remove("hidden");
}

beginBtn.addEventListener("click", startPuzzle);

nextBtn.addEventListener("click", () => {
  if (puzzleIndex < PUZZLES.length - 1) {
    puzzleIndex++;
    const p = PUZZLES[puzzleIndex];
    introText.textContent = p.intro;
    introOverlay.classList.remove("hidden");
    doneOverlay.classList.add("hidden");
    trayEl.innerHTML = "";
    render();
  } else {
    document.getElementById("game").classList.add("hidden");
    reward.classList.remove("hidden");
  }
});

questionsBtn.addEventListener("click", () => {
  // Page 3 can be added later.
  window.location.href = "page3.html";
});

function init() {
  const p = PUZZLES[0];
  introText.textContent = p.intro;
  render();
}

window.addEventListener("resize", () => {
  if (!reward.classList.contains("hidden")) return;
  render();
});

init();
