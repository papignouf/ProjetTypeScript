import * as readline from 'readline';

const ROWS = 6;
const COLS = 7;
type Cell = null | 'R' | 'Y';

function createEmptyBoard(): Cell[][] {
  const b: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null));
  return b;
}

function printBoard(board: Cell[][]) {
  console.clear();
  for (let r = 0; r < ROWS; r++) {
    let row = '|';
    for (let c = 0; c < COLS; c++) {
      row += board[r][c] === null ? '   |' : ` ${board[r][c]} |`;
    }
    console.log(row);
    console.log('-'.repeat(COLS * 4 + 1));
  }
  let cols = ' ';
  for (let c = 0; c < COLS; c++) cols += `  ${c} `;
  console.log(cols);
}

function findAvailableRow(board: Cell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === null) return r;
  return -1;
}

const board = createEmptyBoard();
let currentPlayer: 'R' | 'Y' = 'R';

// Simple REPL to allow playing single-player moves
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function promptTurn() {
  printBoard(board);
  rl.question(`Joueur ${currentPlayer}, entre la colonne (0-${COLS - 1}) : `, (ans) => {
    const col = parseInt(ans.trim(), 10);
    if (isNaN(col) || col < 0 || col >= COLS) {
      console.log('Colonne invalide');
      return promptTurn();
    }
    const row = findAvailableRow(board, col);
    if (row === -1) {
      console.log('Colonne pleine');
      return promptTurn();
    }
    board[row][col] = currentPlayer;
    // toggle player
    currentPlayer = currentPlayer === 'R' ? 'Y' : 'R';
    promptTurn();
  });
}

promptTurn();