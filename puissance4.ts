import * as readline from 'readline';
import { promises as fs } from 'fs';
import * as path from 'path';

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;
type Cell = null | 'R' | 'Y';

function createEmptyBoard(): Cell[][] { return Array.from({length: ROWS}, () => new Array(COLS).fill(null)); }

function printBoard(board: Cell[][]) {
  console.clear();
  for (let r = 0; r < ROWS; r++) {
    let row = '|';
    for (let c = 0; c < COLS; c++) row += board[r][c] === null ? '   |' : ` ${board[r][c]} |`;
    console.log(row);
    console.log('-'.repeat(COLS * 4 + 1));
  }
  let cols = ' ';
  for (let c = 0; c < COLS; c++) cols += `  ${c} `;
  console.log(cols);
}

function findAvailableRow(board: Cell[][], col: number): number { for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === null) return r; return -1; }
function countDirection(board: Cell[][], r: number, c: number, dr: number, dc: number, player: 'R' | 'Y'): number { let cnt=0; let x=r,y=c; while (x>=0 && x<ROWS && y>=0 && y<COLS && board[x][y]===player) { cnt++; x+=dr; y+=dc; } return cnt; }
function checkWin(board: Cell[][], row: number, col: number, player: 'R' | 'Y'): boolean { const dirs=[[0,1],[1,0],[1,1],[1,-1]]; for (const [dr,dc] of dirs) if (countDirection(board,row,col,dr,dc,player)+countDirection(board,row,col,-dr,-dc,player)-1 >= WIN_COUNT) return true; return false; }
function isDraw(board: Cell[][]): boolean { for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (board[r][c]===null) return false; return true; }

const board = createEmptyBoard();
let currentPlayer: 'R' | 'Y' = 'R';
let isGameOver = false;
const history: {row:number;col:number;player:'R'|'Y'}[] = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function sleep(ms:number) { return new Promise(res=>setTimeout(res, ms)); }

function printHelp() {
  console.log('\nCommandes:');
  console.log(" <col>        - jouer en colonne (ex: 3)");
  console.log(" undo         - annuler dernier coup");
  console.log(" ai [easy]    - IA medium (ou easy si précisé)");
  console.log(" save <file>  - sauvegarder en JSON");
  console.log(" load <file>  - charger JSON");
  console.log(" replay       - rejouer l'historique");
  console.log(" reset        - réinitialiser");
  console.log(" help         - afficher aide");
  console.log(" exit         - quitter\n");
}

async function replayHistory() {
  if (history.length === 0) { console.log('Aucun historique'); return; }
  const snap = createEmptyBoard();
  console.clear();
  console.log('Replay...');
  for (let i=0;i<history.length;i++) {
    const step = history[i];
    snap[step.row][step.col] = step.player;
    printBoard(snap);
    await sleep(400);
  }
  console.log('Fin du replay.');
}

async function saveGame(filename:string) {
  try { await fs.writeFile(path.resolve(process.cwd(), filename), JSON.stringify({board,history,currentPlayer,isGameOver},null,2),'utf8'); console.log('Sauvegardé'); }
  catch(err){ console.log('Erreur save:', String(err)); }
}

async function loadGame(filename:string) {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), filename),'utf8');
    const data = JSON.parse(content);
    if (!data || !Array.isArray(data.board)) { console.log('Fichier invalide'); return; }
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) board[r][c]=data.board[r][c];
    history.length = 0; for (const h of data.history) history.push(h);
    currentPlayer = data.currentPlayer; isGameOver = data.isGameOver;
    console.log('Chargé');
  } catch(err){ console.log('Erreur load:', String(err)); }
}

function aiChooseColumn(board: Cell[][], aiPlayer: 'R' | 'Y', mode: 'easy'|'medium'='medium'): number {
  const opponent = aiPlayer === 'R' ? 'Y' : 'R';
  const valid = Array.from({length:COLS},(_,i)=>i).filter(c=>findAvailableRow(board,c)!==-1);
  if (mode==='easy') return valid[Math.floor(Math.random()*valid.length)];
  for (const c of valid) { const r=findAvailableRow(board,c); board[r][c]=aiPlayer; if (checkWin(board,r,c,aiPlayer)) {board[r][c]=null; return c;} board[r][c]=null; }
  for (const c of valid) { const r=findAvailableRow(board,c); board[r][c]=opponent; if (checkWin(board,r,c,opponent)) {board[r][c]=null; return c;} board[r][c]=null; }
  const pref=[3,2,4,1,5,0,6]; for (const p of pref) if (valid.includes(p)) return p;
  return valid[Math.floor(Math.random()*valid.length)];
}

function undo() { if (history.length===0) { console.log('Rien à annuler'); return; } const last = history.pop()!; board[last.row][last.col]=null; currentPlayer = last.player; isGameOver=false; }

async function promptTurn() {
  printBoard(board);
  if (isGameOver) { rl.close(); return; }
  rl.question('Entrez commande (help pour liste): ', async (line) => {
    const s = line.trim();
    if (!s) return promptTurn();
    const parts = s.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    if (cmd==='help') { printHelp(); return promptTurn(); }
    if (cmd==='replay') { await replayHistory(); return promptTurn(); }
    if (cmd==='save') { await saveGame(parts[1]||`save_${Date.now()}.json`); return promptTurn(); }
    if (cmd==='load') { await loadGame(parts[1]); printBoard(board); return promptTurn(); }
    if (cmd==='undo') { undo(); return promptTurn(); }
    if (cmd==='reset') { for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) board[r][c]=null; history.length=0; currentPlayer='R'; isGameOver=false; return promptTurn(); }
    if (cmd==='ai') { const mode = parts[1]==='easy'?'easy':'medium'; const col = aiChooseColumn(board,currentPlayer,mode); const row=findAvailableRow(board,col); board[row][col]=currentPlayer; history.push({row,col,player:currentPlayer}); if (checkWin(board,row,col,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; } if (isDraw(board)) { printBoard(board); console.log('Match nul'); isGameOver=true; rl.close(); return; } currentPlayer = currentPlayer==='R'?'Y':'R'; return promptTurn(); }

    const col = parseInt(cmd,10);
    if (!isNaN(col)) {
      const row = findAvailableRow(board,col);
      if (row===-1) { console.log('Colonne pleine'); return promptTurn(); }
      board[row][col]=currentPlayer; history.push({row,col,player:currentPlayer});
      if (checkWin(board,row,col,currentPlayer)) { printBoard(board); console.log(`Le joueur ${currentPlayer} a gagné !`); isGameOver=true; rl.close(); return; }
      if (isDraw(board)) { printBoard(board); console.log('Match nul'); isGameOver=true; rl.close(); return; }
      currentPlayer = currentPlayer==='R'?'Y':'R'; return promptTurn();
    }
    console.log('Commande inconnue'); return promptTurn();
  });
}

promptTurn();