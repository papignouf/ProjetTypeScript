import * as readline from 'readline';
import { promises as fs } from 'fs';
import * as path from 'path';

const ROWS = 6;
const COLS = 7;
const WIN_COUNT = 4;
type Cell = null | 'R' | 'Y';
type Player = 'R' | 'Y';

let board: Cell[][] = createEmptyBoard();
let currentPlayer: Player = 'R';
let isGameOver = false;
const history: { row: number; col: number; player: Player }[] = [];
let rl: readline.Interface | null = null;

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(null));
}

function cloneBoard(src: Cell[][]): Cell[][] {
  return src.map(row => row.slice());
}

function printBoard(b: Cell[][]) {
  console.clear();
  console.log('Puissance 4 — Terminal\n');
  for (let r = 0; r < ROWS; r++) {
    let line = '|';
    for (let c = 0; c < COLS; c++) {
      const cell = b[r][c];
      if (cell === 'R') line += ` R |`;
      else if (cell === 'Y') line += ` Y |`;
      else line += `   |`;
    }
    console.log(line);
    console.log('-'.repeat(COLS * 4 + 1));
  }

  let idxLine = ' ';
  for (let c = 0; c < COLS; c++) idxLine += ` ${c}  `;
  console.log(idxLine + '\n');
}

function findAvailableRow(b: Cell[][], col: number): number {
  if (col < 0 || col >= COLS) return -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][col] === null) return r;
  }
  return -1;
}

function countDirection(b: Cell[][], r: number, c: number, dr: number, dc: number, player: Player): number {
  let cnt = 0;
  let x = r, y = c;
  while (x >= 0 && x < ROWS && y >= 0 && y < COLS && b[x][y] === player) {
    cnt++;
    x += dr; y += dc;
  }
  return cnt;
}

function checkWin(b: Cell[][], row: number, col: number, player: Player): boolean {
  const dirs = [
    { dr: 0, dc: 1 },  
    { dr: 1, dc: 0 },  
    { dr: 1, dc: 1 }, 
    { dr: 1, dc: -1 }  
  ];
  for (const d of dirs) {
    const c1 = countDirection(b, row, col, d.dr, d.dc, player);
    const c2 = countDirection(b, row, col, -d.dr, -d.dc, player);
    if (c1 + c2 - 1 >= WIN_COUNT) return true;
  }
  return false;
}

function isDraw(b: Cell[][]): boolean {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (b[r][c] === null) return false;
  return true;
}

function findWinningSequence(b: Cell[][], row: number, col: number, player: Player): { row: number; col: number }[] {
  const dirs = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  for (const d of dirs) {
    const seq: {row:number;col:number}[] = [];
    
    let x = row, y = col;
    while (x >= 0 && x < ROWS && y >= 0 && y < COLS && b[x][y] === player) {
      seq.unshift({ row: x, col: y });
      x -= d.dr; y -= d.dc;
    }
    
    x = row + d.dr; y = col + d.dc;
    while (x >= 0 && x < ROWS && y >= 0 && y < COLS && b[x][y] === player) {
      seq.push({ row: x, col: y });
      x += d.dr; y += d.dc;
    }
    if (seq.length >= WIN_COUNT) return seq;
  }
  return [];
}

function aiChooseColumn(b: Cell[][], aiPlayer: Player, mode: 'easy'|'medium'='medium'): number {
  const opponent: Player = aiPlayer === 'R' ? 'Y' : 'R';
  const valid = Array.from({ length: COLS }, (_, i) => i).filter(c => findAvailableRow(b, c) !== -1);
  if (valid.length === 0) return -1; 
  if (mode === 'easy') {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  for (const c of valid) {
    const r = findAvailableRow(b, c);
    if (r === -1) continue;
    b[r][c] = aiPlayer;
    const win = checkWin(b, r, c, aiPlayer);
    b[r][c] = null;
    if (win) return c;
  }
  for (const c of valid) {
    const r = findAvailableRow(b, c);
    if (r === -1) continue;
    b[r][c] = opponent;
    const oppWin = checkWin(b, r, c, opponent);
    b[r][c] = null;
    if (oppWin) return c;
  }
  const pref = [3, 2, 4, 1, 5, 0, 6];
  for (const p of pref) if (valid.includes(p)) return p;
  return valid[Math.floor(Math.random() * valid.length)];
}


function isValidBoardShape(obj: any): obj is Cell[][] {
  if (!Array.isArray(obj) || obj.length !== ROWS) return false;
  for (const row of obj) {
    if (!Array.isArray(row) || row.length !== COLS) return false;
    for (const cell of row) {
      if (cell !== null && cell !== 'R' && cell !== 'Y') return false;
    }
  }
  return true;
}

async function saveGame(filename: string) {
  try {
    const data = { board, history, currentPlayer, isGameOver };
    const p = path.resolve(process.cwd(), filename);
    await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Partie sauvegardée -> ${p}`);
  } catch (err) {
    console.error('Erreur sauvegarde :', err);
  }
}

async function loadGame(filename: string) {
  try {
    const p = path.resolve(process.cwd(), filename);
    const raw = await fs.readFile(p, 'utf8');
    const data = JSON.parse(raw);
    if (!data || !isValidBoardShape(data.board) || !Array.isArray(data.history)) {
      console.log('Fichier invalide : format attendu non retrouvé.');
      return;
    }
  
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) board[r][c] = data.board[r][c];
    history.length = 0;
    for (const h of data.history) {
      if (typeof h.row === 'number' && typeof h.col === 'number' && (h.player === 'R' || h.player === 'Y')) {
        history.push(h);
      }
    }
    currentPlayer = data.currentPlayer === 'R' ? 'R' : 'Y';
    isGameOver = !!data.isGameOver;
    console.log(`Partie chargée depuis ${p}`);
  } catch (err) {
    console.error('Erreur chargement :', err);
  }
}

function undo() {
  if (history.length === 0) {
    console.log('Aucun coup à annuler.');
    return;
  }
  const last = history.pop()!;
  if (last && board[last.row] && typeof board[last.row][last.col] !== 'undefined') {
    board[last.row][last.col] = null;
    currentPlayer = last.player; 
    isGameOver = false;
    console.log('Dernier coup annulé.');
  } else {
    console.log('Impossible d\'annuler (données incohérentes).');
  }
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }
async function replayHistory() {
  if (history.length === 0) { console.log('Aucun historique à rejouer.'); return; }
  const snap = createEmptyBoard();
  console.clear(); console.log('Replay...');
  for (const step of history) {
    snap[step.row][step.col] = step.player;
    printBoard(snap);
    await sleep(350);
  }
  console.log('Fin du replay.');
}

function printHelp() {
  console.log('\nCommandes disponibles :');
  console.log(' <col>            -> jouer en colonne (ex: 3)');
  console.log(' ai [easy]        -> jouer coup IA (medium par défaut)');
  console.log(' undo             -> annuler le dernier coup');
  console.log(' save <fichier>   -> sauvegarder en JSON');
  console.log(' load <fichier>   -> charger un JSON');
  console.log(' replay           -> rejouer l\'historique');
  console.log(' reset            -> recommencer');
  console.log(' help             -> afficher cette aide');
  console.log(' exit / quit      -> quitter\n');
}

function startREPL() {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
  printBoard(board);
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) { rl!.prompt(); return; }
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    try {
      if (cmd === 'help') {
        printHelp();
      } else if (cmd === 'replay') {
        await replayHistory();
      } else if (cmd === 'save') {
        const fname = parts[1] || `puissance4_${Date.now()}.json`;
        await saveGame(fname);
      } else if (cmd === 'load') {
        const fname = parts[1];
        if (!fname) console.log('Précise le nom de fichier à charger.');
        else { await loadGame(fname); printBoard(board); }
      } else if (cmd === 'undo') {
        undo(); printBoard(board);
      } else if (cmd === 'reset') {
        board = createEmptyBoard(); history.length = 0; currentPlayer = 'R'; isGameOver = false; printBoard(board);
      } else if (cmd === 'ai') {
        if (isGameOver) console.log('La partie est terminée. reset pour rejouer.');
        else {
          const mode = parts[1] === 'easy' ? 'easy' : 'medium';
          const col = aiChooseColumn(board, currentPlayer, mode);
          if (col === -1) { console.log('Aucun coup valide pour l\'IA.'); }
          else {
            const row = findAvailableRow(board, col);
            if (row === -1) { console.log('Erreur IA: colonne inattendue pleine.'); }
            else {
              board[row][col] = currentPlayer;
              history.push({ row, col, player: currentPlayer });
              printBoard(board);
              if (checkWin(board, row, col, currentPlayer)) {
                console.log(`Le joueur ${currentPlayer} a gagné !`);
                isGameOver = true;
                rl!.close();
                return;
              }
              if (isDraw(board)) {
                console.log('Match nul !');
                isGameOver = true;
                rl!.close();
                return;
              }
              currentPlayer = currentPlayer === 'R' ? 'Y' : 'R';
            }
          }
        }
      } else if (cmd === 'exit' || cmd === 'quit') {
        console.log('Au revoir 👋');
        rl!.close();
        return;
      } else {
        const maybe = parseInt(cmd, 10);
        if (!isNaN(maybe)) {
          const col = maybe;
          if (col < 0 || col >= COLS) { console.log('Colonne hors limites.'); }
          else {
            const row = findAvailableRow(board, col);
            if (row === -1) { console.log('Colonne pleine.'); }
            else {
              board[row][col] = currentPlayer;
              history.push({ row, col, player: currentPlayer });
              printBoard(board);
              if (checkWin(board, row, col, currentPlayer)) {
                console.log(`Le joueur ${currentPlayer} a gagné !`);
                isGameOver = true;
                rl!.close();
                return;
              }
              if (isDraw(board)) {
                console.log('Match nul !');
                isGameOver = true;
                rl!.close();
                return;
              }
              currentPlayer = currentPlayer === 'R' ? 'Y' : 'R';
            }
          }
        } else {
          console.log(`Commande inconnue : "${cmd}". Tape "help".`);
        }
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    }

    if (rl) rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nSession terminée.');
    process.exit(0);
  });
}

startREPL();