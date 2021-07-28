import { MemoryInterface } from './memory-interface';
import { SM83 } from './sharp-sm83';

import { PPU, PPURegister } from './ppu';
import { Clock } from './clock';

import { PixelCanvas } from './pixel-canvas';

// @ts-ignore
// import romDataRaw from '../test-roms/gameboy-test-roms-v3.0/blargg/mem_timing/individual/01-read_timing.gb';
// import romDataRaw from '../test-roms/dmg-acid2.gb';
// import romDataRaw from '../roms/dr-mario.gb';
import romDataRaw from '../roms/tetris.gb';
// import romDataRaw from '../blargg/cpu_instrs.gb';
// import romDataRaw from '../roms/alleyway.gb';
import { toBinString, toHexString } from './utils';
import { Timer } from './timer';

import { GameBoyButton, Input } from './input';

const CYCLES_PER_ANIMATION_FRAME = 70224;
const MAX_SPEED_MULTIPLIER = 15;
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
  memory: MemoryInterface = new MemoryInterface();
  input: Input = new Input();
  timer: Timer = new Timer(this.clock);
  cpu: SM83 = new SM83(this.memory, this.input, this.timer, this.clock);
  screen: PixelCanvas = new PixelCanvas(document.getElementById('main') as HTMLCanvasElement);
  ppu: PPU = new PPU(this.cpu, this.screen, this.clock);

  private _loop = () => {};

  constructor() {
    this.memory.connect(this.cpu, this.ppu, this.input, this.timer);
    this.timer.connect(this.cpu);

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

const sb = new SpelBoy();

const romData = new Uint8Array(romDataRaw);
sb.memory.loadROMBank0(romData.slice(0, 0x4000));
sb.memory.loadROMBank1(romData.slice(0x4000, 0x8000));

sb.run();

document.addEventListener('keydown', e => {
  console.log(e.key)
  if (e.key === 'd') {
    const vram = sb.ppu.getVRAM();
    const vramString = [...vram].map(x => toHexString(x, 2)).join(' ');

    const dumpEl = document.createElement('textarea') as HTMLTextAreaElement;
    dumpEl.value = vramString;
    document.body.appendChild(dumpEl);

    console.log(vramString);
    sb.hardStop();
  }

  if (e.key === 'r') {
    const prettyPrint = (n:number) => {
      return `$${toHexString(n)} (${toBinString(n)}})`
    };

    const regs = {
      LCDC: prettyPrint(sb.memory.read(PPURegister.LCDC)),
      STAT: prettyPrint(sb.memory.read(PPURegister.STAT)),
      SCY: prettyPrint(sb.memory.read(PPURegister.SCY)),
      SCX: prettyPrint(sb.memory.read(PPURegister.SCX)),
      LY: prettyPrint(sb.memory.read(PPURegister.LY)),
      LYC: prettyPrint(sb.memory.read(PPURegister.LYC)),
      DMA: prettyPrint(sb.memory.read(PPURegister.DMA)),
      BGP: prettyPrint(sb.memory.read(PPURegister.BGP)),
      OBP0: prettyPrint(sb.memory.read(PPURegister.OBP0)),
      OBP1: prettyPrint(sb.memory.read(PPURegister.OBP1)),
      WX: prettyPrint(sb.memory.read(PPURegister.WX)),
      WY: prettyPrint(sb.memory.read(PPURegister.WY)),
    };

    console.log(regs);
    // sb.hardStop();
  }

  if (e.key === '0') {
    speedMultiplier = speedMultiplier === 1 ? MAX_SPEED_MULTIPLIER : 1;
  }
});
