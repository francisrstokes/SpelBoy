import { IMemoryInterface } from './memory-interface';
import { Register8 } from './memory-interface/register';
import { toBinString } from './utils';

export enum InputAddress {
  P1 = 0xFF00,
};

enum InputBit {
  ActionButtons = 5,
  DirectionButtons = 4,
  DownOrStart = 3,
  UpOrSelect = 2,
  LeftOrB = 1,
  RightOrA = 0,
};

export enum GameBoyButton {
  Down = 'Down',
  Up = 'Up',
  Left = 'Left',
  Right = 'Right',
  Start = 'Start',
  Select = 'Select',
  B = 'B',
  A = 'A',
};

type Buttons = Record<GameBoyButton, number>;

export class Input implements IMemoryInterface {
  private buttons: Buttons = {
    [GameBoyButton.Down]: 0,
    [GameBoyButton.Up]: 0,
    [GameBoyButton.Left]: 0,
    [GameBoyButton.Right]: 0,
    [GameBoyButton.Start]: 0,
    [GameBoyButton.Select]: 0,
    [GameBoyButton.B]: 0,
    [GameBoyButton.A]: 0,
  };

  private P1: Register8 = new Register8(0xff);

  read(address: number) {
    // Note: All these buttons are active low (0 = active), but we're storing them as active high
    if (this.P1.bit(InputBit.ActionButtons) === 0) {
      return (this.P1.value & 0xf0)
        | ((~this.buttons.Start & 1) << InputBit.DownOrStart)
        | ((~this.buttons.Select & 1) << InputBit.UpOrSelect)
        | ((~this.buttons.B & 1) << InputBit.LeftOrB)
        | ((~this.buttons.A & 1) << InputBit.RightOrA);
    }

    if (this.P1.bit(InputBit.DirectionButtons) === 0) {
      return (this.P1.value & 0xf0)
        | ((~this.buttons.Down & 1) << InputBit.DownOrStart)
        | ((~this.buttons.Up & 1) << InputBit.UpOrSelect)
        | ((~this.buttons.Left & 1) << InputBit.LeftOrB)
        | ((~this.buttons.Right & 1) << InputBit.RightOrA);
    }

    console.log(`Got to default. Actual P1=${toBinString(this.P1.value)}`)

    return 0xff;
  }

  anyButtonIsHeld() {
    return Object.values(this.buttons).some(Boolean);
  }

  write(address: number, value: number) {
    this.P1.value = (this.P1.value & (~0x30 & 0xff)) | (value & 0x30);
  }

  press(button: GameBoyButton) {
    this.buttons[button] = 1;
  }

  release(button: GameBoyButton) {
    this.buttons[button] = 0;
  }
}
