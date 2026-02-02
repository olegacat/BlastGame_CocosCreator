import { GameModel } from "../model/GameModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HUDView extends cc.Component {
  @property(cc.Label)
  movesLabel: cc.Label = null;

  @property(cc.Label)
  scoreLabel: cc.Label = null;

  public updateHUD(model: GameModel) {
    if (this.movesLabel) {
      this.movesLabel.string = model.moves.toString();
    }

    if (this.scoreLabel) {
      this.scoreLabel.string = `${model.score}/${model.targetScore}`;
    }
  }
}
