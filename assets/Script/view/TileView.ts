const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
  @property(cc.Sprite)
  sprite: cc.Sprite = null;
  @property([cc.SpriteFrame])
  colorSprites: cc.SpriteFrame[] = [];
  @property(cc.ParticleSystem)
  destroyParticles: cc.ParticleSystem = null;
 

  public currentColorIndex: number = 0;
  public row: number = 0;
  public column: number = 0;

  public init(
    row: number,
    column: number,
    colorIdx: number,
    cellSize?: cc.Size,
  ) {
    this.row = row;
    this.column = column;
    this.currentColorIndex = colorIdx;
    this.sprite.spriteFrame = this.colorSprites[colorIdx];
    
    
    if (cellSize) {
      this.node.setContentSize(cellSize);
    }
  }

  public playShakeAnimation() {
    this.node.stopAllActions();

    this.node.angle = 0;
    this.node.scale = 0;

    cc.tween(this.node)

      .to(0.1, { angle: 7, scale: 0.9 })
      .to(0.1, { angle: -7 })
      .to(0.1, { angle: 8, scale: 0.95 })
      .to(0.1, { angle: 4, scale: 0.9 })
      .to(0.1, { angle: 0, scale: 1 })
      .start();
  }

  public playDestroyAnimation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.destroyParticles) {
        console.warn("destroyParticles is not connected!");
        resolve();
        return;
      }
         this.sprite.node.active = false;
      this.node.zIndex = 20;

      this.destroyParticles.spriteFrame = this.sprite.spriteFrame;
      this.destroyParticles.resetSystem();

      this.scheduleOnce(() => {
        this.node.destroy();
        resolve();
      }, this.destroyParticles.duration  );
    });
  }

  // LIFE-CYCLE CALLBACKS:

  // start() {

  // }

  // update (dt) {}
}
