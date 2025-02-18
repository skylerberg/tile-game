import type { Tile, TileValue } from './tile.ts';
import type { Suit } from './suit.ts';
import type { Level } from './level.ts';
import { blue, green, white, red } from './suit';

export type Condition = (
    { type: 'ContainSuits', suits: Array<Suit> } |
    { type: 'ContainNumbers', numbers: Array<TileValue> } |
    { type: 'SumGreaterThan', amount: number } |
    { type: 'OddOrSuit', suit: Suit } |
    { type: 'EvenOrSuit', suit: Suit }
  ) & { title: string | undefined }



export function evaluate(
  condition: Condition,
  spaces: Array<Tile | undefined>
): boolean | null {
  const tiles: Array<Tile> = spaces.filter(space => !!space);
  const complete = tiles.length === 4;

  if (condition.type === 'SumGreaterThan') {
    const total = tiles.reduce(
      (accumulator, tile) => accumulator + tile.value,
      0,
    );
    if (total > condition.amount) {
      return true;
    }
    else if (complete) {
      return false;
    }
    else if (total + 4 * (4 - tiles.length) <= condition.amount) {
      return false;
    }
    else {
      return null;
    }
  }

  if (condition.type === 'ContainSuits') {
    return containsSuits(tiles, condition.suits);
  }

  if (condition.type === 'ContainNumbers') {
    return containsNumbers(tiles, condition.numbers);
  }

  if (condition.type === 'EvenOrSuit') {
    for (const tile of tiles) {
      if (!(tile.suit === condition.suit || tile.value % 2 === 0)) {
        return false;
      }
    }
    return complete || null;
  }

  if (condition.type === 'OddOrSuit') {
    for (const tile of tiles) {
      if (!(tile.suit === condition.suit || tile.value % 2 === 1)) {
        return false;
      }
    }
    return complete || null;
  }

  throw new Error(`Programming Error: Condition "${condition.type}" did not match any evaluator`);
}

export function containsSuits(
  tiles: Array<Tile>,
  requiredSuits: Array<Suit>,
): boolean | null {
  const suits = requiredSuits.slice();
  const complete = tiles.length === 4;

  for (const tile of tiles) {
    var index = suits.indexOf(tile.suit);
    if (index === -1) {
      return false;
    }
    suits.splice(index, 1);
  }
  if (!complete) {
    return null;
  }
  return suits.length === 0;
}

export function containsNumbers(
  tiles: Array<Tile>,
  requiredNumbers: Array<TileValue>,
): boolean | null {
  const numbers = requiredNumbers.slice();
  const complete = tiles.length === 4;

  for (const tile of tiles) {
    var index = numbers.indexOf(tile.value);
    if (index === -1) {
      return false;
    }
    numbers.splice(index, 1);
  }
  if (!complete) {
    return null;
  }
  return numbers.length === 0;
}

export function getTitle(condition: Condition, type: 'row' | 'column'): string {
  if (condition.type === 'SumGreaterThan') {
    return `Tiles in ${type} must add to more than ${condition.amount}`;
  }

  if (condition.type === 'ContainSuits') {
    return `Must have a matching tile in ${type} for each shown symbol`;
  }

  if (condition.type === 'ContainNumbers') {
    return `Must have a matching tile in ${type} for each number shown`;
  }

  if (condition.type === 'EvenOrSuit') {
    return `Each tile in ${type} must be even or match the symbol shown`;
  }

  if (condition.type === 'OddOrSuit') {
    return `Each tile in ${type} must be odd or match the symbol shown`;
  }

  throw new Error(`Programming Error: Condition "${condition.type}" needs a title`);
}

export function solve(level: Level): Array<Array<Tile | undefined>> | undefined {
  const rows: Array<Array<Tile | undefined>> = [
    [undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined],
  ];
  const values: Array<TileValue> = [1, 2, 3, 4];
  const suits: Array<Suit> = [red, blue, white, green];
  const tiles: Array<Tile> = [];
  for (const suit of suits) {
    for (const value of values) {
      tiles.push({suit, value});
    }
  }
  return solveInner(level, rows, tiles, 1);
}

function solveInner(level: Level, board: Array<Array<Tile | undefined>>, tiles: Array<Tile>, depth: number): Array<Array<Tile | undefined>> | undefined {
  const currentStatus = checkPuzzle(level, board);
  if (currentStatus === true) {
    return board;
  }
  else if (currentStatus === false) {
    return undefined;
  }
  outer_loop:
  for (const [rowIndex, row] of board.entries()) {
    for (const [colIndex, space] of row.entries()) {
      if (space === undefined) {
        for (let i = tiles.length - 1; i >= 0; i--) {
          const tile = tiles.splice(i, 1)[0];
          board[rowIndex][colIndex] = tile;
          let solution = solveInner(level, board, tiles, depth + 1);
          if (solution) {
            return solution;
          }
          board[rowIndex][colIndex] = undefined;
          tiles.push(tile);
        }
        break outer_loop;
      }
    }
  }
}

function checkPuzzle(level: Level, board: Array<Array<Tile | undefined>>): boolean | null {
  let result: boolean | null = true;
  for (const [index, row] of board.entries()) {
    const evaluation = evaluate(level.rowConditions[index], row);
    if (evaluation === false) {
      return false;
    }
    if (evaluation === null) {
      result = null;
    }
  }

  const columns = [
    [board[0][0], board[1][0], board[2][0], board[3][0]],
    [board[0][1], board[1][1], board[2][1], board[3][1]],
    [board[0][2], board[1][2], board[2][2], board[3][2]],
    [board[0][3], board[1][3], board[2][3], board[3][3]],
  ];
  for (const [index, column] of columns.entries()) {
    const evaluation = evaluate(level.colConditions[index], column);
    if (evaluation === false) {
      return false;
    }
    if (evaluation === null) {
      result = null;
    }
  }

  return result;
}
