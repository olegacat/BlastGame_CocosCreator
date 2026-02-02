// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { Grid, TCell, TFallMove } from "../model/Grid";
import { TileView } from "../view/TileView";
 

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileBoardView extends cc.Component {
  private isProcessing: boolean = false;

  @property(cc.Node) // I will divide logic in this file and layout in tileContainer
  boardContainer: cc.Node = null;

  @property(cc.Prefab) // I need prefab instance, so I could get the size.
  tilePrefab: cc.Prefab = null;

  @property
  rows: number = 9;
  @property
  columns: number = 9;
  @property
  tileGapHorizontal: number = 1;
  @property
  tileGapVertical: number = 4;

  @property({ type: cc.AudioClip })
  destroySound: cc.AudioClip = null;
  @property({ type: cc.AudioClip })
  soundDullClick: cc.AudioClip = null;

  private tileSize: cc.Size = null; // size of a tile
  private tiles: TileView[][] = []; //   empty arr (2dimensional type)
  public gridLogic: Grid = null;

  private amountOfColorsInTile = 5; // static for now  (put it in a variable against magic variables)

  //
  //Main view logic //
  start() {
    this.updateTileSize();

    this.gridLogic = new Grid(
      this.rows,
      this.columns,
      this.amountOfColorsInTile,
      this.tileSize,
      this.tileGapHorizontal,
      this.tileGapVertical,
    );

    this.generateGrid();
  }

  //
  // setting tile size from board //
  private updateTileSize() {
    const boardSize = this.boardContainer.getContentSize();
    const margin = 54;

    const availableWidth = boardSize.width - margin * 2;
    const availableHeight = boardSize.height - margin * 2;

    const tileWidth =
      (availableWidth - (this.columns - 1) * this.tileGapHorizontal) /
      this.columns;
    const tileHeight =
      (availableHeight - (this.rows - 1) * this.tileGapVertical) / this.rows;

    this.tileSize = cc.size(tileWidth, tileHeight);
  }

  //
  // generate grid //
  private generateGrid() {
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = []; //now we add empty rows
      for (let c = 0; c < this.columns; c++) {
        //here we will fill every row with columns
        this.createTile(r, c);
      }
    }
  }

  //
  // create tiles in row col in array[r][c] //
  private createTile(row: number, col: number) {
    const tileNode = cc.instantiate(this.tilePrefab);
    tileNode.parent = this.boardContainer;

    const tile = tileNode.getComponent(TileView);

    const colorIdx = this.gridLogic.getColorIdx(row, col);
    tile.init(row, col, colorIdx, this.tileSize);
    this.tiles[row][col] = tile;

    const { newX, newY } = this.gridLogic.calculatePosition(row, col);
    tileNode.zIndex = this.rows - row; //top have higher value
    tileNode.setPosition(newX, newY);

    tileNode.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
      const clickedTile = event.target.getComponent(TileView);
      this.onTileClick(clickedTile.row, clickedTile.column);
    });
  }

  //
  // ON TILE CLICK FUNC //
  private onTileClick(row: number, col: number) {
    if (this.isProcessing) {
      if (this.soundDullClick) {
        const audioId = cc.audioEngine.playEffect(this.soundDullClick, false);
        cc.audioEngine.setVolume(audioId, 0.2);
      }
      return;
    }

    //getting matches from grid model
    const { matches, colorIdx } = this.gridLogic.getMatches(row, col);

    if (matches.length === 1) {
      // call shake Animation if you pressed on combination of only 1 tile
      this.tiles[row][col].playShakeAnimation();
      if (this.soundDullClick) {
        const audioId = cc.audioEngine.playEffect(this.soundDullClick, false);
        cc.audioEngine.setVolume(audioId, 0.2);
      }
      return;
    }

    if (this.destroySound) {
      const audioId = cc.audioEngine.playEffect(this.destroySound, false);
      cc.audioEngine.setVolume(audioId, 0.2);
    }
    //deleting matches
    this.isProcessing = true; // stop clicks while deleting happens
    this.handleDestroyingTiles(matches);


    // send amount of popped tiles to GameManager by event MATCH_FOUND
    this.node.emit("MATCH_FOUND", matches.length);

  }

  //
  // DESTROY TILES //
  private async handleDestroyingTiles(matches: TCell[]) {
    matches.forEach((cell) => {
      const tile = this.tiles[cell.row][cell.col];
      if (tile) {
        tile.playDestroyAnimation();
      } else {
        console.error(
          "tile wasnt found",
          "[",
          cell.row,
          "]",
          "[",
          cell.col,
          "]",
        );
      }
    });

    matches.forEach((cell) => {
      const tile = this.tiles[cell.row][cell.col];
      if (tile) {
        this.tiles[cell.row][cell.col] = null;
      }
    });

    this.gridLogic.destroyMatches(matches);

    const { moves, newCells } = this.gridLogic.applyGravity();
    console.log("newCells from grid File: ", newCells);
    await Promise.all([
      this.animateFallingTiles(moves),
      this.handleSpawningNewTiles(newCells),
    ]);

    this.isProcessing = false;
  }

  //
  // ANIMATE FALLING TILES //
  private animateFallingTiles(moves: TFallMove[]): Promise<void[]> {
    const fallPromises = moves.map((move) => {
      const tile = this.tiles[move.fromRow][move.col];
      if (!tile) {
        console.log("tile wasnt found");
        return Promise.resolve();
      }

      tile.row = move.toRow;
      tile.column = move.col;

      const { newY } = this.gridLogic.calculatePosition(move.toRow, move.col);

      return new Promise<void>((resolve) => {
        cc.tween(tile.node)
          .to(0.5, { y: newY }, { easing: "bounceOut" })
          .call(() => {
            this.tiles[move.toRow][move.col] = tile;
            this.tiles[move.toRow][move.col].node.zIndex =
              this.rows - move.toRow;
            if (this.tiles[move.fromRow][move.col] === tile) {
              this.tiles[move.fromRow][move.col] = null;
            }
            resolve();
          })
          .start();
      });
    });

    return Promise.all(fallPromises);
  }

  private async handleSpawningNewTiles(
    newTiles: { row: number; col: number; color: number }[],
  ): Promise<void> {
  
    const spawningNewTilesPromises: Promise<void>[] = [];

    newTiles.forEach((cell) => {
      this.createTile(cell.row, cell.col);
      const tileView = this.tiles[cell.row][cell.col];
      if (!tileView) {
        console.log("tileView wasnt found");
        return;
      }

      const { newX, newY } = this.gridLogic.calculatePosition(
        tileView.row,
        tileView.column,
      );
      const offsetY = newY + this.tileSize.height;
      tileView.node.setPosition(newX, newY + offsetY * this.rows - cell.row);

      spawningNewTilesPromises.push(
        new Promise<void>((resolve) => {
          cc.tween(tileView.node)
            .to(0.6, { y: newY }, { easing: "cubicOut" })
            .call(resolve)
            .start();
        }),
      );
    });

    await Promise.all(spawningNewTilesPromises);
  }

  //

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {}

  // update (dt) {}


  /////////  /////////  /////////  /////////
  ///////// SMALL HANDLERS ////////////////////

 public getIsProcessing(): boolean {
    return this.isProcessing;
  }

public setInteraction(active: boolean) { 
    this.isProcessing = !active;
}


}