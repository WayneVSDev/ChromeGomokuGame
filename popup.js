let boardSize = 15;
let currentPlayer = 'black';
let gameBoard = [];
let isAIEnabled = false;

const boardElement = document.getElementById('game-board');
const statusElement = document.getElementById('status');
const newGameButton = document.getElementById('new-game');
const toggleAIButton = document.getElementById('toggle-ai');
const closeButton = document.getElementById('close-extension');
const boardSizeInput = document.getElementById('board-size');
const placeSound = document.getElementById('place-sound');
const winSound = document.getElementById('win-sound');

function initializeBoard() {
  gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 25px)`;
  boardElement.innerHTML = '';

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener('click', handleCellClick);
      boardElement.appendChild(cell);
    }
  }

  currentPlayer = 'black';
  updateStatus();
  saveGameState();
}

function handleCellClick(event) {
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  if (gameBoard[row][col] !== null) return;

  placeStone(row, col);

  if (isAIEnabled && currentPlayer === 'white') {
    makeAIMove();
  }
}

function placeStone(row, col) {
  gameBoard[row][col] = currentPlayer;
  const cell = boardElement.children[row * boardSize + col];
  cell.classList.add(currentPlayer);
  
  placeSound.play();

  if (checkWin(row, col)) {
    statusElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins!`;
    winSound.play();
    disableBoard();
  } else {
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateStatus();
  }

  saveGameState();
}

function updateStatus() {
  statusElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
  if (isAIEnabled && currentPlayer === 'white') {
    statusElement.textContent += " (AI thinking...)";
  }
}

function checkWin(row, col) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  for (const [dx, dy] of directions) {
    let count = 1;
    count += countDirection(row, col, dx, dy);
    count += countDirection(row, col, -dx, -dy);

    if (count >= 5) return true;
  }

  return false;
}

function countDirection(row, col, dx, dy) {
  let count = 0;
  let x = row + dx;
  let y = col + dy;

  while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && gameBoard[x][y] === currentPlayer) {
    count++;
    x += dx;
    y += dy;
  }

  return count;
}

function disableBoard() {
  const cells = document.getElementsByClassName('cell');
  for (const cell of cells) {
    cell.removeEventListener('click', handleCellClick);
  }
}

function makeAIMove() {
  // Simple AI: finds the first empty cell
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (gameBoard[i][j] === null) {
        setTimeout(() => placeStone(i, j), 500); // Delay to simulate thinking
        return;
      }
    }
  }
}

function saveGameState() {
  const gameState = {
    boardSize,
    gameBoard,
    currentPlayer,
    isAIEnabled
  };
  chrome.storage.local.set({ gameState });
}

function loadGameState() {
  chrome.storage.local.get('gameState', (result) => {
    if (result.gameState) {
      const { boardSize: savedBoardSize, gameBoard: savedGameBoard, currentPlayer: savedCurrentPlayer, isAIEnabled: savedIsAIEnabled } = result.gameState;
      boardSize = savedBoardSize;
      gameBoard = savedGameBoard;
      currentPlayer = savedCurrentPlayer;
      isAIEnabled = savedIsAIEnabled;
      boardSizeInput.value = boardSize;
      toggleAIButton.textContent = isAIEnabled ? "Play vs Human" : "Play vs AI";
      renderSavedBoard();
      updateStatus();
    } else {
      initializeBoard();
    }
  });
}

function renderSavedBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 25px)`;
  boardElement.innerHTML = '';

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (gameBoard[i][j]) {
        cell.classList.add(gameBoard[i][j]);
      }
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.addEventListener('click', handleCellClick);
      boardElement.appendChild(cell);
    }
  }
}

newGameButton.addEventListener('click', () => {
  boardSize = parseInt(boardSizeInput.value);
  if (boardSize < 5) boardSize = 5;
  if (boardSize > 19) boardSize = 19;
  initializeBoard();
});

toggleAIButton.addEventListener('click', () => {
  isAIEnabled = !isAIEnabled;
  toggleAIButton.textContent = isAIEnabled ? "Play vs Human" : "Play vs AI";
  updateStatus();
  saveGameState();
  if (isAIEnabled && currentPlayer === 'white') {
    makeAIMove();
  }
});

closeButton.addEventListener('click', () => {
  window.close();
});

// Load the game state when the popup is opened
loadGameState();