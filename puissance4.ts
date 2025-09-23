import * as readline from 'readline';

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;
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

// checks contiguous in a direction
function countDirection(board: Cell[][], r: number, c: number, dr: number, dc: number, player: 'R' | 'Y'): number {
  let count = 0;
  let x = r, y = c;
  while (x >= 0 && x < ROWS && y >= 0 && y < COLS && board[x][y] === player) {
    count++;
    x += dr;
    y += dc;
  }
  return count;
}

function checkWin(board: Cell[][], row: number, col: number, player: 'R' | 'Y'): boolean {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) {
    const c1 = countDirection(board, row, col, dr, dc, player);
    const c2 = countDirection(board, row, col, -dr, -dc, player);
    if (c1 + c2 - 1 >= WIN_COUNT) return true;
  }
  return false;
}

function isDraw(board: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

const board = createEmptyBoard();
let currentPlayer: 'R' | 'Y' = 'R';
let isGameOver = false;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function promptTurn() {
  printBoard(board);
  if (isGameOver) {
    rl.close();
    return;
  }
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
    if (checkWin(board, row, col, currentPlayer)) {
      printBoard(board);
      console.log(`Le joueur ${currentPlayer} a gagné !`);
      isGameOver = true;
      rl.close();
      return;
    }
    if (isDraw(board)) {
      printBoard(board);
      console.log('Match nul !');
      isGameOver = true;
      rl.close();
      return;
    }
    currentPlayer = currentPlayer === 'R' ? 'Y' : 'R';
    promptTurn();
  });
}

promptTurn();