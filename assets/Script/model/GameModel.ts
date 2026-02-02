export class GameModel {
  public score: number = 0;
  public moves: number;
  public targetScore: number;

  //   public shuffleBoosterCount: number = 5;
  //   public bombBoosterCount: number = 3;

  constructor(moves: number, target: number) {
    this.moves = moves;
    this.targetScore = target;
  }

  //Adding score
  public addScore(matchCount: number): void {
    const baseBonus = 10 
    const bonus = matchCount > 5 ? (matchCount - 5) * 15 : 0;
    this.score += bonus + baseBonus;
  }

  //if allowed count of moves ended then false
  public funcUseMoves(): boolean {
    if (this.moves > 0) {
      this.moves--;
      return true;
    }
    return false;
  }

  public get isWin(): boolean {
    return this.score >= this.targetScore;
  }

  public get isGameOver(): boolean {
    return this.moves <= 0 && this.score < this.targetScore;
  }
}
