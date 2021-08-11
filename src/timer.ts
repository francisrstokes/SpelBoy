import { SpelBoy } from './spelboy';
import { IMemoryInterface } from './memory-interface';
import { Register16, Register8 } from './memory-interface/register';
import { InterruptType, SM83 } from './sharp-sm83';

export enum TimerAddress {
  Start = 0xFF04,

  DIV = 0xFF04,
  TIMA = 0xFF05,
  TMA = 0xFF06,
  TAC = 0xFF07,

  End = 0xFF07
};

const dividerLookup = [9, 3, 5, 7];

export class Timer implements IMemoryInterface {
  private spelboy: SpelBoy;
  private lastUpdatedAtCycle = 0;

  private DIV = new Register16(0x0000);
  private TIMA = new Register8(0x00);
  private TMA = new Register8(0x00);
  private TAC = new Register8(0x00);

  private previousAndResult = 0;
  private shouldLoadTIMA = false;
  private TIMALoadCountdown = 0;

  private get clock() { return this.spelboy.clock; }
  private get cpu() { return this.spelboy.cpu; }

  constructor(spelboy: SpelBoy) {
    this.spelboy = spelboy;
  }

  resetDIV() {
    this.DIV.value = 0;
  }

  // TODO: The edge case behaviour of writing to TIMA on the same T-cycle as a reload, or writing
  // to TMA on the same T-cycle as a reload, is not yet implemented. That will require some tracking
  // of when writes to those registers occurred, and checking in the update loop
  update() {
    let catchupCycles = this.clock.cycles - this.lastUpdatedAtCycle;
    while (catchupCycles > 0) {
      this.DIV.value++;

      const bitPos = dividerLookup[this.TAC.value & 0b11];
      const bit = this.DIV.bit(bitPos);
      const andResult = this.TAC.bit(2) & bit;

      if (this.previousAndResult === 1 && andResult === 0) {
        this.TIMA.value++;

        if (this.TIMA.didOverflow()) {
          this.shouldLoadTIMA = true;
          this.TIMALoadCountdown = 5;
          this.TIMA.clearOverflow();
          this.cpu.requestInterrupt(InterruptType.Timer);
        }
      }

      if (this.shouldLoadTIMA) {
        if (this.TIMALoadCountdown > 0) {
          this.TIMALoadCountdown--;
        } else {
          this.shouldLoadTIMA = false;
          this.TIMA.value = this.TMA.value;
        }
      }

      this.previousAndResult = andResult;
      catchupCycles--;
    }
    this.lastUpdatedAtCycle = this.clock.cycles;
  }

  read(address: number) {
    switch (address) {
      case TimerAddress.DIV: {
        return this.DIV.value >> 8;
      }

      case TimerAddress.TIMA: {
        return this.TIMA.value;
      }

      case TimerAddress.TMA: {
        return this.TMA.value;
      }

      case TimerAddress.TAC: {
        return this.TAC.value;
      }

      default: return 0xff;
    }
  }

  write(address: number, value: number) {
    switch (address) {
      case TimerAddress.DIV: {
        this.DIV.value = 0;
        return;
      }

      case TimerAddress.TIMA: {
        this.TIMA.value = value;
        this.shouldLoadTIMA = false;
        return
      }

      case TimerAddress.TMA: {
        this.TMA.value = value;
        return
      }

      case TimerAddress.TAC: {
        this.TAC.value = value;
        return
      }
    }
  }

}
