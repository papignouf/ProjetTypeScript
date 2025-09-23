const ROWS = 6;
const COLS = 7;
type Cell = null | 'R' | 'Y';

function createEmptyBoard(): Cell[][] {
  const b: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    b.push(new Array(COLS).fill(null));
  }
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

// Main - affichage d'un plateau vide
const board = createEmptyBoard();
printBoard(board);