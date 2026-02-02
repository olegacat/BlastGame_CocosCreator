// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { GameModel } from "../model/GameModel";
import HUDView from "../view/HUDView";
import TileBoardView from "./TileBoardView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {
  @property(TileBoardView)
  board: TileBoardView = null;

  @property(HUDView)
  hud: HUDView = null;

  //Level Settings
  @property({ type: cc.Integer, displayName: "Limit for moves" })
  movesLimit: number = 30;

  @property({ type: cc.Integer, displayName: "Score to win" })
  targetScore: number = 500;

  //UI ELEMENTS
  @property(cc.Node)
  startScreen: cc.Node = null;

  @property(cc.Node)
  resultModal: cc.Node = null;

  @property(cc.Label)
  resultTitle: cc.Label = null;

  @property(cc.Label)
  resultScore: cc.Label = null;

  private model: GameModel = null;

  onLoad() {
    this.model = new GameModel(this.movesLimit, this.targetScore);
    this.board.node.on("MATCH_FOUND", this.handleMatch, this);
    this.board.setInteraction(false);
  }

  start() {
    this.updateUI();

    if (this.startScreen) this.startScreen.active = true;
    if (this.resultModal) this.resultModal.active = false;
  }

  public onPlayButtonClicked() {
    if (this.startScreen) {
      this.startScreen.active = false;
    }

    this.board.setInteraction(true);

    this.model = new GameModel(this.movesLimit, this.targetScore);
    this.updateUI();

    console.log("Game started!");
  }

  // Amount of burnt tiles
  private async handleMatch(matchCount: number) {
    console.log("match count arrived", matchCount);
    if (this.model.moves <= 0) return;

    // we use one move
    this.model.funcUseMoves();
    // we add score in model
    this.model.addScore(matchCount);

    this.updateUI();

    // wait all animations on board to end
    await this.waitForBoard();

    // check conditions of game
    this.checkGameStatus();
  }

  // Func to check if we won or lost
  private checkGameStatus() {
    if (this.model.isWin) {
      this.finishGame("You win!");
      return;
    }

    if (this.model.moves <= 0) {
      this.finishGame("You lost (There is no moves)");
      return;
    }

    // check if there are still availible tiles to pop
    const canMove = this.board.gridLogic.hasPossibleMatches();
    if (!canMove) {
      this.finishGame("You Lost (No tiles left)");
      return;
    }
  }

  private updateUI() {
    if (this.hud) {
      this.hud.updateHUD(this.model);
    }
  }

  private finishGame(message: string) {
    this.board.setInteraction(false);

    if (this.resultModal) {
      this.resultModal.active = true;

      if (this.resultTitle) {
        this.resultTitle.string = message;
      }

      if (this.resultScore) {
        this.resultScore.string = `Final Score: ${this.model.score}`;
      }

      this.resultModal.scale = 0.5;
      cc.tween(this.resultModal)
        .to(0.3, { scale: 1 }, { easing: "backOut" })
        .start();
    }

    console.log("GAME OVER: " + message);
  }

  private async waitForBoard(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.board.getIsProcessing()) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  //restart Game
  public restartGame() {
    cc.director.loadScene(cc.director.getScene().name);
  }
}
