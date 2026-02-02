//we take out logic of managing gridPlayField in our model file

export type TCell = {
  row: number;
  col: number;
};

export type TFallMove = {
  fromRow: number;
  toRow: number;
  col: number;
  colorIdx: number;
};

const COLOR_NAMES: Record<number, string> = {
  [-1]: "_____",
  0: "BLUE",
  1: "GREEN",
  2: "PURPLE",
  3: "RED",
  4: "YELLOW",
};

export class Grid {
  public data: number[][];
  private amountRows: number;
  private amountCols: number;

  private emptyCellIdx: number = -1; //avoiding magic numbers
  private colorsCount: number;

  private tileSize: cc.Size = null;
  private tileGapHorizontal: number = 1;
  private tileGapVertical: number = 4;

  constructor(
    amountRows: number,
    amountCols: number,
    colorsCount: number,
    tileSize: cc.Size,
    tileGapHorizontal: number,
    tileGapVertical: number,
  ) {
    this.amountRows = amountRows;
    this.amountCols = amountCols;
    this.colorsCount = colorsCount;
    this.tileSize = tileSize;
    this.tileGapHorizontal = tileGapHorizontal;
    this.tileGapVertical = tileGapVertical;
    // we create an empty 2 dimensional array and fill it with colorTileIdx options
    this.data = Array.from({ length: amountRows }, () =>
      Array.from({ length: amountCols }, () => this.randomColor()),
    );
  }

  //function to see table that is for logic in console
  private debugPrint() {
    console.table(
      this.data.map((row) => row.map((cell) => COLOR_NAMES[cell] ?? cell)),
    );
  }

  /////
  //APPLY GRAVITY  (We will go from the bottom left to )

  public applyGravity(): {
    moves: TFallMove[];
    newCells: { row: number; col: number; color: number }[];
  } {
    const moves: TFallMove[] = [];
    const newCells: { row: number; col: number; color: number }[] = [];

    for (let col = 0; col < this.amountCols; col++) {
      let rowIndex = this.amountRows - 1;

      for (let row = this.amountRows - 1; row >= 0; row--) {
        const color = this.data[row][col];

        if (color !== this.emptyCellIdx) {
          if (row !== rowIndex) {
            this.data[rowIndex][col] = color;
            this.data[row][col] = this.emptyCellIdx;

            moves.push({
              fromRow: row,
              toRow: rowIndex,
              col: col,
              colorIdx: color,
            });
          }

          rowIndex--;
        }
      }

      for (let row = rowIndex; row >= 0; row--) {
        const color = this.randomColor();
        this.data[row][col] = color;
        newCells.push({ row, col, color });
      }
    }

    return { moves, newCells };
  }

  /////
  //find all coords of all neighboring cells with same color
  public getMatches(
    row: number,
    col: number,
  ): {
    matches: { row: number; col: number; colorIdx: number }[];
    colorIdx: number;
  } {
    const currentColorIdx = this.data[row][col];

    if (currentColorIdx === this.emptyCellIdx)
      return { matches: [], colorIdx: currentColorIdx };

    const matches: { row: number; col: number; colorIdx: number }[] = [];
    const visited = new Set<string>();

    const dfs = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (visited.has(key)) return;
      if (r < 0 || r >= this.amountRows || c < 0 || c >= this.amountCols)
        return;

      const color = this.data[r][c];

      if (color === this.emptyCellIdx) return;
      if (color !== currentColorIdx) return;

      visited.add(key);
      matches.push({ row: r, col: c, colorIdx: color });

      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    };

    dfs(row, col);

    return { matches, colorIdx: currentColorIdx };
  }

  /////
  //CHANGING COLOR INDEX in cells to be negative, it means that they are deleted.
  public destroyMatches(matches: TCell[]) {
    matches.forEach((tile) => {
      this.data[tile.row][tile.col] = this.emptyCellIdx;
    });
  }

  /////
  //Checking if there is at least one availible couple to click (starting from left top and checking all  right and down)
  public hasPossibleMatches(): boolean {
    for (let r = 0; r < this.amountRows; r++) {
      for (let c = 0; c < this.amountCols; c++) {
        const color = this.data[r][c];
        if (color === this.emptyCellIdx) continue;

        if (c + 1 < this.amountCols && this.data[r][c + 1] === color)
          return true;

        if (r + 1 < this.amountRows && this.data[r + 1][c] === color)
          return true;
      }
    }
    return false;
  }

  /////////  /////////  /////////  /////////
  // HELPERS/////////  /////////  /////////

  //calculating tile position on board //
  public calculatePosition(row: number, col: number) {
    const widthTile = this.tileSize.width;
    const heightTile = this.tileSize.height;

    const widthContainer =
      this.amountCols * widthTile +
      (this.amountRows - 1) * this.tileGapHorizontal;
    const heightContainer =
      this.amountRows * heightTile +
      (this.amountCols - 1) * this.tileGapVertical;

    const startXContainer = -widthContainer / 2 + widthTile / 2;
    const startYContainer = heightContainer / 2 - heightTile / 2;

    const newX = startXContainer + col * (widthTile + this.tileGapHorizontal);
    const newY = startYContainer - row * (heightTile + this.tileGapVertical);

    return { newX, newY };
  }

  /////////  /////////  /////////  /////////
  ///////// SMALL HANDLERS ////////////////////

  //pseudo random color (bc its Math.random() and you can find out the sequence of it)
  private randomColor(): number {
    return Math.floor(Math.random() * this.colorsCount);
  }

  //get color by cell cords
  public getColorIdx(row: number, col: number): number {
    return this.data[row][col];
  }

  //set color by cell cords + colorIdx
  public setColorIdx(row: number, col: number, colorIdx: number): void {
    this.data[row][col] = colorIdx;
    // this.debugPrint();
  }
}
