

import * as readline from 'readline';
import { promises as fs } from 'fs';
import * as path from 'path';

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;
type Cell = null | 'R' | 'Y';

function createEmptyBoard(): Cell[][] { const b: Cell[][] = []; for (let r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null)); return b; }
function printBoard(board: Cell[][]) { console.clear(); for (let r = 0; r < ROWS; r++) { let row = '|'; for (let c = 0; c < COLS; c++) row += board[r][c] === null ? '   |' : ` ${board[r][c]} |`; console.log(row); console.log('-'.repeat(COLS * 4 + 1)); } let cols = ' '; for (let c = 0; c < COLS; c++) cols += `  ${c} `; console.log(cols); }

function findAvailableRow(board: Cell[][], col: number): number { for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === null) return r; return -1; }
function countDirection(board: Cell[][], r: number, c: number, dr: number, dc: number, player: 'R' | 'Y'): number { let count = 0; let x = r, y = c; while (x >= 0 && x < ROWS && y >= 0 && y < COLS && board[x][y] === player) { count++; x += dr; y += dc; } return count; }
function checkWin(board: Cell[][], row: number, col: number, player: 'R' | 'Y'): boolean { const dirs = [[0,1],[1,0],[1,1],[1,-1]]; for (const [dr,dc] of dirs) { if (countDirection(board,row,col,dr,dc,player) + countDirection(board,row,col,-dr,-dc,player) - 1 >= WIN_COUNT) return true; } return false; }
function isDraw(board: Cell[][]): boolean { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c] === null) return false; return true; }

const board = createEmptyBoard();
let currentPlayer: 'R' | 'Y' = 'R';
let isGameOver = false;
const history: {row:number;col:number;player:'R'|'Y'}[] = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function saveGame(filename: string) {
  try {
    const data = { board, history, currentPlayer, isGameOver };
    const p = path.resolve(process.cwd(), filename);
    await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Partie sauvegardée dans ${p}`);
  } catch (err) { console.log(`Erreur sauvegarde: ${String(err)}`); }
}

async function loadGame(filename: string) {
  try {
    const p = path.resolve(process.cwd(), filename);
    const content = await fs.readFile(p, 'utf8');
    const data = JSON.parse(content);
    if (!data || !Array.isArray(data.board) || !Array.isArray(data.history)) { console.log('Fichier invalide'); return; }
    // basic assign
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) board[r][c] = data.board[r][c];
    history.length = 0; for (const h of data.history) history.push(h);
    currentPlayer = data.currentPlayer;
    isGameOver = data.isGameOver;
    console.log(`Partie chargée depuis ${p}`);
  } catch (err) { console.log(`Erreur chargement: ${String(err)}`); }
}

function aiChooseColumn(board: Cell[][], aiPlayer: 'R' | 'Y', mode: 'easy'|'medium'='medium'): number { const opponent = aiPlayer === 'R' ? 'Y' : 'R'; const valid = Array.from({length:COLS},(_,i)=>i).filter(c => findAvailableRow(board,c)!==-1); if (mode==='easy') return valid[Math.floor(Math.random()*valid.length)]; for (const c of valid) { const r = findAvailableRow(board,c); board[r][c] = aiPlayer; if (checkWin(board,r,c,aiPlayer)) { board[r][c] = null; return c;} board[r][c] = null; } for (const c of valid) { const r = findAvailableRow(board,c); board[r][c] = opponent; if (checkWin(board,r,c,opponent)) { board[r][c] = null; return c;} board[r][c] = null; } const pref=[3,2,4,1,5,0,6]; for (const p of pref) if (valid.includes(p)) return p; return valid[Math.floor(Math.random()*valid.length)]; }

function undo() { if (history.length===0) { console.log('Rien à annuler'); return; } const last = history.pop()!; board[last.row][last.col] = null; currentPlayer = last.player; isGameOver = false; console.log('Dernier coup annulé'); }

function promptTurn() {
  printBoard(board);
  if (isGameOver) { rl.close(); return; }
  rl.question(`Joueur ${currentPlayer} (col/ai/save/load/undo): `, async (ans) => {
    const s = ans.trim();
    if (s==='undo') { undo(); return promptTurn(); }
    if (s.startsWith('save')) { const file = s.split(/\s+/)[1] || `save_${Date.now()}.json`; await saveGame(file); return promptTurn(); }
    if (s.startsWith('load')) { const file = s.split(/\s+/)[1]; if (!file) { console.log('Précise le fichier'); return promptTurn(); } await loadGame(file); printBoard(board); return promptTurn(); }
    if (s.startsWith('ai')) { const parts = s.split(/\s+/); const mode = parts[1]==='easy' ? 'easy' : 'medium'; const aiCol = aiChooseColumn(board, currentPlayer, mode); const row = findAvailableRow(board, aiCol); board[row][aiCol] = currentPlayer; history.push({row,col:aiCol,player:currentPlayer}); if (checkWin(board,row,aiCol,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; } if (isDraw(board)) { printBoard(board); console.log('Match nul !'); isGameOver=true; rl.close(); return; } currentPlayer = currentPlayer==='R' ? 'Y' : 'R'; return promptTurn(); }
    const col = parseInt(s,10); if (isNaN(col) || col<0 || col>=COLS) { console.log('Colonne invalide'); return promptTurn(); }
    const row = findAvailableRow(board,col); if (row===-1) { console.log('Colonne pleine'); return promptTurn(); }
    board[row][col] = currentPlayer; history.push({row,col,player:currentPlayer});
    if (checkWin(board,row,col,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; }
    if (isDraw(board)) { printBoard(board); console.log('Match nul !'); isGameOver=true; rl.close(); return; }
    currentPlayer = currentPlayer==='R' ? 'Y' : 'R';
    promptTurn();
  });
}

promptTurn();
