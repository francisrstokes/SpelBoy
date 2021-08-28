import { MemoryInterface } from './memory-interface';
import { SM83 } from './sharp-sm83';
import { PPU } from './ppu';
import { Clock } from './clock';
import { Timer } from './timer';
import { GameBoyButton, Input } from './input';

import { PixelCanvas } from './pixel-canvas';
import { parseCart, ParsedHeader } from './cart-parser';

const CYCLES_PER_ANIMATION_FRAME = 70224;
const MAX_SPEED_MULTIPLIER = 15;
const MIN_SPEED_MULTIPLIER = 0.1;
let speedMultiplier = 1;

const keyMap: Record<string, GameBoyButton> = {
  ArrowUp: GameBoyButton.Up,
  ArrowDown: GameBoyButton.Down,
  ArrowLeft: GameBoyButton.Left,
  ArrowRight: GameBoyButton.Right,
  a: GameBoyButton.A,
  s: GameBoyButton.B,
  q: GameBoyButton.Start,
  w: GameBoyButton.Select,
};

export class SpelBoy {
  clock: Clock = new Clock();
  memory: MemoryInterface = new MemoryInterface(this);
  timer: Timer = new Timer(this);
  input: Input = new Input();
  cpu: SM83 = new SM83(this);
  ppu: PPU = new PPU(this);
  screen: PixelCanvas = new PixelCanvas(document.getElementById('main') as HTMLCanvasElement);

  cart: Uint8Array  = new Uint8Array();
  header: ParsedHeader;

  private _loop = () => {};

  constructor() {
    document.addEventListener('keydown', e => {
      if (e.key in keyMap) {
        this.input.press(keyMap[e.key]);
      }
    });

    document.addEventListener('keyup', e => {
      if (e.key in keyMap) {
        this.input.release(keyMap[e.key]);
      }
    });
  }

  load(cart: Uint8Array) {
    this.header = parseCart(cart);
    this.cart = cart;
    this.memory.initialise(this.header, this.cart);
  }

  loop = () => {
    const cyclesAtStartOfLoop = this.clock.cycles;
    while (this.clock.cycles - cyclesAtStartOfLoop < (CYCLES_PER_ANIMATION_FRAME * speedMultiplier)) {
      this.cpu.fetchDecodeExecute();
      this.ppu.update();
      this.timer.update();
    }
    requestAnimationFrame(this.loop);
  }

  run() {
    this.loop();
  }

  hardStop() {
    this._loop = this.loop;
    this.loop = () => {};
  }
}

let sb: SpelBoy;
let keyHandler: (e: KeyboardEvent) => void;

const load = (data: Uint8Array) => {
  if (sb) {
    sb.hardStop();
  }

  sb = new SpelBoy();
  sb.load(data);
  sb.run();

  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
  }

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === '0') {
      speedMultiplier = speedMultiplier === 1 ? MAX_SPEED_MULTIPLIER : 1;
    }

    if (e.key === '9') {
      speedMultiplier = speedMultiplier === 1 ? MIN_SPEED_MULTIPLIER : 1;
    }
  }

  document.addEventListener('keydown', keyHandler);
}

document.getElementById('loadRom').addEventListener('change', async (e: Event) => {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    if (typeof event.target.result === 'string') {
      throw new Error('Invalid ROM file');
    }
    load(new Uint8Array(event.target.result));
  });
  reader.readAsArrayBuffer((e.target as HTMLInputElement).files[0]);
});