export class Clock {
  cycles: number = 0;

  tick(n: number) {
    this.cycles += n;
  }
};
