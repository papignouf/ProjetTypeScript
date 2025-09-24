// puissance4.ts - v0.6
// Ajout IA simple et commande 'ai'

import * as readline from 'readline';

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;
type Cell = null | 'R' | 'Y';

function createEmptyBoard(): Cell[][] { const b: Cell[][] = []; for (let r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null)); return b; }
function printBoard(board: Cell[][]) {
  console.clear();
  for (let r = 0; r < ROWS; r++) {
    let row = '|';
    for (let c = 0; c < COLS; c++) row += board[r][c] === null ? '   |' : ` ${board[r][c]} |`;
    console.log(row);
    console.log('-'.repeat(COLS * 4 + 1));
  }
  let cols = ' '; for (let c = 0; c < COLS; c++) cols += `  ${c} `; console.log(cols);
}

function findAvailableRow(board: Cell[][], col: number): number { for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === null) return r; return -1; }

function countDirection(board: Cell[][], r: number, c: number, dr: number, dc: number, player: 'R' | 'Y'): number {
  let count = 0; let x = r, y = c;
  while (x >= 0 && x < ROWS && y >= 0 && y < COLS && board[x][y] === player) { count++; x += dr; y += dc; }
  return count;
}

function checkWin(board: Cell[][], row: number, col: number, player: 'R' | 'Y'): boolean {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr,dc] of dirs) { if (countDirection(board,row,col,dr,dc,player) + countDirection(board,row,col,-dr,-dc,player) - 1 >= WIN_COUNT) return true; }
  return false;
}

function isDraw(board: Cell[][]): boolean { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c] === null) return false; return true; }

// IA simple
function aiChooseColumn(board: Cell[][], aiPlayer: 'R' | 'Y', mode: 'easy' | 'medium' = 'medium'): number {
  const opponent = aiPlayer === 'R' ? 'Y' : 'R';
  const valid = Array.from({length: COLS}, (_, i) => i).filter(c => findAvailableRow(board,c) !== -1);
  if (mode === 'easy') return valid[Math.floor(Math.random()*valid.length)];
  // medium: can we win?
  for (const c of valid) {
    const r = findAvailableRow(board, c);
    board[r][c] = aiPlayer;
    if (checkWin(board, r, c, aiPlayer)) { board[r][c] = null; return c; }
    board[r][c] = null;
  }
  // block opponent
  for (const c of valid) {
    const r = findAvailableRow(board, c);
    board[r][c] = opponent;
    if (checkWin(board, r, c, opponent)) { board[r][c] = null; return c; }
    board[r][c] = null;
  }
  // fallback: center preference
  const pref = [3,2,4,1,5,0,6];
  for (const p of pref) if (valid.includes(p)) return p;
  return valid[Math.floor(Math.random()*valid.length)];
}

const board = createEmptyBoard();
let currentPlayer: 'R' | 'Y' = 'R';
let isGameOver = false;
const history: {row:number;col:number;player:'R'|'Y'}[] = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function undo() { if (history.length === 0) { console.log('Rien à annuler'); return; } const last = history.pop()!; board[last.row][last.col] = null; currentPlayer = last.player; isGameOver = false; console.log('Dernier coup annulé'); }

function promptTurn() {
  printBoard(board);
  if (isGameOver) { rl.close(); return; }
  rl.question(`Joueur ${currentPlayer} (col / 'undo' / 'ai'): `, (ans) => {
    const s = ans.trim().toLowerCase();
    if (s === 'undo') { undo(); return promptTurn(); }
    if (s.startsWith('ai')) {
      // usage: ai or ai easy/medium
      const parts = s.split(/\s+/);
      const mode = parts[1] === 'easy' ? 'easy' : 'medium';
      const aiCol = aiChooseColumn(board, currentPlayer === 'R' ? 'Y' : 'Y', mode);
      console.log(`IA choisit ${aiCol}`);
      const row = findAvailableRow(board, aiCol); board[row][aiCol] = currentPlayer; history.push({row,col:aiCol,player:currentPlayer});
      if (checkWin(board,row,aiCol,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; }
      if (isDraw(board)) { printBoard(board); console.log('Match nul !'); isGameOver=true; rl.close(); return; }
      currentPlayer = currentPlayer === 'R' ? 'Y' : 'R'; return promptTurn();
    }
    const col = parseInt(s,10);
    if (isNaN(col) || col<0 || col>=COLS) { console.log('Colonne invalide'); return promptTurn(); }
    const row = findAvailableRow(board,col);
    if (row === -1) { console.log('Colonne pleine'); return promptTurn(); }
    board[row][col] = currentPlayer; history.push({row,col,player:currentPlayer});
    if (checkWin(board,row,col,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; }
    if (isDraw(board)) { printBoard(board); console.log('Match nul !'); isGameOver=true; rl.close(); return; }
    currentPlayer = currentPlayer === 'R' ? 'Y' : 'R';
    promptTurn();
  });
}

promptTurn();
