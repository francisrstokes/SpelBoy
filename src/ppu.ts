import { SpelBoy } from './spelboy';
import { Color } from './pixel-canvas';
import { asI8 } from './utils';
import { IMemoryInterface } from './memory-interface';
import { Register8 } from './memory-interface/register';
import { InterruptType } from './sharp-sm83';

const colors: Color[] = [
  [0xff, 0xff, 0xff],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0x00, 0x00, 0x00],
];

export enum LCDControl {
  Enable = (1 << 7),
  WindowTilemapArea = (1 << 6),
  WindowEnable = (1 << 5),
  BGAndWindowTileDataArea = (1 << 4),
  BGTileDataArea = (1 << 3),
  ObjSize = (1 << 2),
  ObjEnable = (1 << 1),
  BGAndWindowPriority = (1 << 0),

  EnableBit = 7,
  WindowTilemapAreaBit = 6,
  WindowEnableBit = 5,
  BGAndWindowTileDataAreaBit = 4,
  BGTileDataAreaBit = 3,
  ObjSizeBit = 2,
  ObjEnableBit = 1,
  BGAndWindowPriorityBit = 0,
}

export enum LCDCBit {
  BGAndWindowEnablePriority,
  OBJEnable,
  OBJSize,
  BGTileMapArea,
  BGAndWindowTileDataArea,
  WindowEnable,
  WindowTileMapArea,
  LCDAndPPUEnable
}

export enum PPURegister {
  Start = 0xFF40,

  LCDC = 0xFF40,
  STAT = 0xFF41,
  SCY = 0xFF42,
  SCX = 0xFF43,
  LY = 0xFF44,
  LYC = 0xFF45,
  DMA = 0xFF46,
  BGP = 0xFF47,
  OBP0 = 0xFF48,
  OBP1 = 0xFF49,
  WX = 0xFF4A,
  WY = 0xFF4B,

  End = 0xFF4B
}

export enum VRAMAddress {
  Start = 0x8000,
  TileBlock1 = 0x8000,
  TileBlock1End = 0x87FF,
  TileBlock2 = 0x8800,
  TileBlock2End = 0x8FFF,
  TileBlock3 = 0x9000,
  TileBlock3End = 0x97FF,
  TileMap0 = 0x9800,
  TileMap0End = 0x9BFF,
  TileMap1 = 0x9C00,
  TileMap1End = 0x9FFF,
  End = 0x9FFF,
}

export enum OAMAddress {
  Start = 0xFE00,
  End = 0xFE9F,
}

export const PIXELS_PER_TILE = 8;
export const PIXELS_PER_ROW = 160;
export const PIXELS_PER_COL = 144;
export const TILES_PER_ROW = PIXELS_PER_ROW >> 3;
export const TILES_PER_COL = PIXELS_PER_COL >> 3;
export const TILES_PER_MAP_ROW = 32;
export const BYTES_PER_TILE = 16;

export enum PPUMode {
  HBlank  = 0,
  VBlank  = 1,
  OAMSearch = 2,
  Drawing = 3,
}

export enum FIFOFetcherState {
  GetTile,
  GetTileDataLow,
  GetTileDataHigh,
  Push,
}

type OAMSearchResult = {
  address: number;
  x: number;
  y: number;
  lineOffsetLow: number;
  lineOffsetHigh: number;
  tileIndex: number;
  flags: number;
};

type SpriteFetcher = {
  state: FIFOFetcherState;
  oamResult: OAMSearchResult;
  lowByte: number;
  highByte: number;
  buffer: Array<SpriteData>;
}

type Fetcher = {
  x: number;
  tileIndex: number;
  lowByte: number;
  highByte: number;
  buffer: Array<{
    paletteIndex: number;
  }>;
  pixel: number;
  windowLineCounter: number;
  doubleBug: boolean;
};

type SpriteData = {
  colorIndex: number;
  bgAndWindowOverSprite: boolean;
  useOBP1: boolean;
};

type FifoData = {
  fetcher: Fetcher;
  spriteFetcher: SpriteFetcher;

  spriteFetch: boolean;
  windowHasBegun: boolean;
  windowLineActive: boolean;
  scanlineX: number;
  currentPixel: number;
  state: FIFOFetcherState;
  bgShiftRegister: Array<number>;
  spriteShiftRegister: Array<SpriteData>;
  isDrawingWindow: boolean;
  hasDiscardedPixels: boolean;
  pixelsToDiscard: number;
};


export class PPU implements IMemoryInterface {
  spelboy: SpelBoy;

  DMAInProgress: boolean = false;
  private DMAIndex: number = 0;
  private DMASourceAddress: number = 0;
  private DMAStartCycle: number = 0;
  private DMAScheduled: boolean = false;
  private DMACountdown: number = 0;

  private isEnabled = false;
  private frame: number = 0;

  private LCDC = new Register8(0x00);
  private STAT = new Register8(0x00);
  private SCY = new Register8(0x00);
  private SCX = new Register8(0x00);
  private LY = new Register8(0x00);
  private LYC = new Register8(0x00);
  private DMA = new Register8(0x00);
  private BGP = new Register8(0x00);
  private OBP0 = new Register8(0x00);
  private OBP1 = new Register8(0x00);
  private WY = new Register8(0x00);
  private WX = new Register8(0x00);

  private lastUpdatedAtCycle: number = 0;
  private OAMSearchBuffer: Array<OAMSearchResult> = [];
  private currentOAMIndex: number = 0;
  private cyclesInScanline: number = 0;
  private cyclesSpentInFrame: number = 0;
  private cyclesSpentInMode: number = 0;

  private VRAM: Uint8Array = new Uint8Array(0x2000);
  private OAM: Uint8Array = new Uint8Array(0xA0);

  private fifoData: FifoData = {
    fetcher: {
      doubleBug: false,
      x: 0,
      buffer: [],
      highByte: 0,
      lowByte: 0,
      tileIndex: 0,
      pixel: 0,
      windowLineCounter: 0
    },

    spriteFetcher: {
      state: FIFOFetcherState.GetTile,
      buffer: [],
      highByte: 0,
      lowByte: 0,
      oamResult: null
    },

    windowHasBegun: false,
    windowLineActive: false,

    spriteFetch: false,
    scanlineX: 0,
    currentPixel: 0,
    state: FIFOFetcherState.GetTile,
    bgShiftRegister: [],
    spriteShiftRegister: [],
    isDrawingWindow: false,
    hasDiscardedPixels: false,
    pixelsToDiscard: null
  };

  private get cpu() { return this.spelboy.cpu; }
  private get clock() { return this.spelboy.clock; }
  private get memory() { return this.spelboy.memory; }
  private get screen() { return this.spelboy.screen; }

  constructor(spelboy: SpelBoy) {
    this.spelboy = spelboy;
  }

  read(address: number) {
    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      return this.VRAM[address - VRAMAddress.Start];
    }

    if (address >= OAMAddress.Start && address <= OAMAddress.End) {
      return this.OAM[address - OAMAddress.Start];
    }

    switch (address) {
      case PPURegister.LCDC: return this.LCDC.value;
      case PPURegister.STAT: return this.STAT.value | 0x80;
      case PPURegister.SCY: return this.SCY.value;
      case PPURegister.SCX: return this.SCX.value;
      case PPURegister.LY: return this.LY.value;
      case PPURegister.LYC: return this.LYC.value;
      case PPURegister.DMA: return this.DMA.value;
      case PPURegister.BGP: return this.BGP.value;
      case PPURegister.OBP0: return this.OBP0.value;
      case PPURegister.OBP1: return this.OBP1.value;
      case PPURegister.WX: return this.WY.value;
      case PPURegister.WY: return this.WX.value;

      default: return 0xff;
    }
  }

  write(address: number, value: number) {
    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      this.VRAM[address - VRAMAddress.Start] = value;
      return;
    }

    if (address >= OAMAddress.Start && address <= OAMAddress.End) {
      this.OAM[address - OAMAddress.Start] = value;
      return;
    }

    switch (address) {
      case PPURegister.LCDC: {
        const enabled = (value & 0x80) === 0x80;

        if (this.isEnabled && !enabled) {
          this.STAT.value &= 0xfc; // Set mode flag to 00b
          this.LY.value = 0;
        } else if (!this.isEnabled && enabled) {
          this.STAT.value = (this.STAT.value & 0xfe) | 0b10; // Set mode flag to 10b
          this.lastUpdatedAtCycle = this.clock.cycles;
          // console.log(`STAT=${toBinString(this.STAT.value)}`)
        }

        this.isEnabled = enabled;
        this.LCDC.value = value;
        return;
      }
      case PPURegister.STAT: { this.STAT.value = value; return; }
      case PPURegister.SCY: { this.SCY.value = value; return; }
      case PPURegister.SCX: { this.SCX.value = value; return; }
      case PPURegister.LY: {
        // TODO: Is this register actually R/W?
        this.LY.value = value; return;
      }
      case PPURegister.LYC: { this.LYC.value = value; return; }
      case PPURegister.DMA: {
        this.DMA.value = value;

        // Can only initiate a DMA transfer when one isn't already in progress
        // TODO: Are there other restrictions?
        if (!this.DMAInProgress) {
          this.DMAInProgress = true;
          this.DMASourceAddress = (value > 0xDF ? 0xDF : value) << 8;
          this.DMAStartCycle = this.clock.cycles;
          this.DMAScheduled = false;
        }

        return;
      }
      case PPURegister.BGP: { this.BGP.value = value; return; }
      case PPURegister.OBP0: { this.OBP0.value = value; return; }
      case PPURegister.OBP1: { this.OBP1.value = value; return; }
    }
  }

  getMode() {
    return (this.STAT.value & 0b11) as PPUMode;
  }

  update() {
    let catchupCycles = this.clock.cycles - this.lastUpdatedAtCycle;

    if (this.DMAInProgress) {
      const bytesLeftToTransfer = 160 - this.DMAIndex;
      const cyclesToCopy = catchupCycles > bytesLeftToTransfer ? bytesLeftToTransfer : catchupCycles;

      for (let i = 0; i < cyclesToCopy; i++) {
        this.OAM[this.DMAIndex] = this.memory.read(this.DMASourceAddress + this.DMAIndex, true);
        this.DMAIndex++;
      }

      if (this.DMAIndex === 160) {
        this.DMAInProgress = false;
        this.DMAIndex = 0;
      }
    }

    // Is the LCD enabled?
    if (!(this.LCDC.value & 0x80)) return;


    while (true) {
      switch (this.getMode()) {
        case PPUMode.OAMSearch: {
          // console.log(`Running OAMSearch for LY=${this.LY.value} (${catchupCycles} cycles to catchup)`);
          const spriteHeight = this.LCDC.value & 0x04 ? 16 : 8;

          // Make sure the buffer is clear
          if (this.currentOAMIndex === 0) {
            this.OAMSearchBuffer = [];
          }

          while (catchupCycles >= 2 && this.currentOAMIndex < 40) {
            const objectAddress = this.currentOAMIndex * 4;
            const oy = this.OAM[objectAddress];
            const ox = this.OAM[objectAddress + 1];
            const tileIndex = this.OAM[objectAddress + 2];
            const flags = this.OAM[objectAddress + 3];

            const ly16 = this.LY.value + 16;

            if (ox > 0 && ly16 >= oy && ly16 < oy + spriteHeight && this.OAMSearchBuffer.length < 10) {
              if (oy === 112) {
                debugger;
              }
              this.OAMSearchBuffer.push({
                address: objectAddress,
                x: ox,
                y: oy,
                lineOffsetLow: ly16 - oy,
                lineOffsetHigh: (ly16 - oy) * 2,
                tileIndex: tileIndex,
                flags
              });
            }

            this.currentOAMIndex++;

            catchupCycles -= 2;
            this.cyclesInScanline += 2;
            this.cyclesSpentInMode += 2;
          }

          // Are we done with OAM search?
          if (this.currentOAMIndex === 40) {
            this.sortOAMSearchBuffer();
            this.currentOAMIndex = 0;
            // Move to Drawing mode
            this.STAT.value |= PPUMode.Drawing;

            // Reset the currentPixel value in the fifo state
            this.fifoData.currentPixel = 0;
            this.fifoData.fetcher.pixel = 0;
            this.fifoData.fetcher.windowLineCounter = 0;
            this.fifoData.spriteFetcher.buffer = [];

            // console.log(`Spent ${this.cyclesSpentInMode} cycles in OAMSearch`);
            this.cyclesSpentInMode = 0;

            // Do we still have cycles to burn?
            if (catchupCycles > 0) continue;
          }

          // There might be a cycle left over here
          this.lastUpdatedAtCycle = this.clock.cycles - catchupCycles;

          return;
        }

        case PPUMode.Drawing: {
          // Fetch and shift pixels to the screen
          let newCatchupCycles = this.pixelPipe(catchupCycles);

          if (newCatchupCycles === catchupCycles) {
            // We don't have enough cycles to progress, let the CPU run some more
            return;
          }

          // Update the time we've spent in this mode
          this.cyclesInScanline += catchupCycles - newCatchupCycles;
          this.cyclesSpentInMode += catchupCycles - newCatchupCycles;
          catchupCycles = newCatchupCycles;

          // If we're at the end of the line, we need to go to HBlank
          const isEndOfLine = (
            this.fifoData.currentPixel > 0
            && this.fifoData.currentPixel % PIXELS_PER_ROW === 0
            && this.cyclesSpentInMode > 0
          );

          if (isEndOfLine) {
            // console.log(`Drawing done for line ${this.LY.value} in ${this.cyclesSpentInMode} cycles (${this.cyclesInScanline} total this line)`);
            this.cyclesSpentInMode = 0;

            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.HBlank;

            // Clear out any remaining data in the fifos
            this.fifoData.bgShiftRegister = [];
            this.fifoData.spriteShiftRegister = [];
            this.fifoData.spriteFetch = false;
            this.fifoData.fetcher.buffer = [];
            this.fifoData.fetcher.x = 0;
            this.fifoData.fetcher.doubleBug = false;
            this.fifoData.windowLineActive = false;
            this.fifoData.state = FIFOFetcherState.GetTile;
          }

          if (catchupCycles <= 0) {
            this.lastUpdatedAtCycle = this.clock.cycles;
            return;
          }

          continue;
        }

        case PPUMode.HBlank: {
          const cyclesTillScanlineEnd = 456 - this.cyclesInScanline;

          if (catchupCycles < cyclesTillScanlineEnd) {
            this.cyclesInScanline += catchupCycles;
            this.cyclesSpentInMode += catchupCycles;
            this.lastUpdatedAtCycle = this.clock.cycles;
            return;
          }

          this.cyclesInScanline += cyclesTillScanlineEnd;
          this.cyclesSpentInMode += cyclesTillScanlineEnd;
          // console.log(`HBlank done for line ${this.LY.value} in ${this.cyclesSpentInMode} cycles (${this.cyclesInScanline} total this line)`);

          catchupCycles -= cyclesTillScanlineEnd;
          this.LY.value += 1;

          this.cyclesSpentInMode += cyclesTillScanlineEnd;
          this.cyclesSpentInFrame += this.cyclesInScanline;
          this.cyclesInScanline = 0;

          // When we start drawing again on the next line, we'll need to discard initial pixels
          // according to SCX (mod 8)
          this.fifoData.hasDiscardedPixels = false;

          if (this.LY.value === 144) {
            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.VBlank;

            this.cpu.requestInterrupt(InterruptType.VBlank);
            this.screen.draw();
          } else {
            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.OAMSearch;
          }

          // console.log(`Spent ${this.cyclesSpentInMode} cycles in HBlank`);
          this.cyclesSpentInMode = 0;

          if (catchupCycles <= 0) {
            this.lastUpdatedAtCycle = this.clock.cycles;
            return;
          }
          continue;
        }

        case PPUMode.VBlank: {
          const cyclesTillScanlineEnd = 456 - this.cyclesInScanline;

          if (catchupCycles < cyclesTillScanlineEnd) {
            this.cyclesInScanline += catchupCycles;
            this.cyclesSpentInMode += catchupCycles;
            this.lastUpdatedAtCycle = this.clock.cycles;
            return;
          }

          this.cyclesInScanline = 0;
          catchupCycles -= cyclesTillScanlineEnd;
          this.LY.value += 1;

          this.cyclesSpentInMode += cyclesTillScanlineEnd;
          this.cyclesSpentInFrame += this.cyclesSpentInMode;

          if (this.LY.value === 154) {
            // console.log(`VBlank done for frame ${this.frame} in ${this.cyclesSpentInMode} cycles (${this.cyclesSpentInFrame} total this frame)`);
            this.frame++;
            this.LY.value = 0;
            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.OAMSearch;
            this.cyclesSpentInMode = 0;
            this.cyclesSpentInFrame = 0;
          }

          if (catchupCycles <= 0) {
            this.lastUpdatedAtCycle = this.clock.cycles;
            return;
          }
          continue;
        }
      }
    }

  }

  private sortOAMSearchBuffer() {
    this.OAMSearchBuffer.sort((a, b) => a.x - b.x);
  }

  private bgFetch() {
    const {fetcher} = this.fifoData;
    // Each step here takes two cycles - and runs in tandem with pixel pushes
    // The coordination is done by the pixelPipe method, and so fetching does not
    // run in a loop, but is executed externally one step at a time

    // TODO: Implement window
    switch (this.fifoData.state) {
      case FIFOFetcherState.GetTile: {
        let tileMapAddress: number;

        if (this.fifoData.isDrawingWindow) {
          const windowTileMapBase = this.LCDC.bit(LCDCBit.WindowTileMapArea) === 0
            ? VRAMAddress.TileMap0
            : VRAMAddress.TileMap1;

          const yOffset = TILES_PER_MAP_ROW * (fetcher.windowLineCounter >> 3);
          tileMapAddress = windowTileMapBase + fetcher.x + yOffset;

          fetcher.windowLineCounter++;
        } else {
          const bgTileMapBase = this.LCDC.bit(LCDCBit.BGTileMapArea) === 0
            ? VRAMAddress.TileMap0
            : VRAMAddress.TileMap1;

          const xOffset = (((fetcher.pixel + this.SCX.value) & 0xff) >> 3);
          const yOffset = TILES_PER_MAP_ROW * (((this.LY.value + this.SCY.value) & 0xff) >> 3);
          tileMapAddress = bgTileMapBase + xOffset + yOffset;
        }

        fetcher.tileIndex = this.VRAM[tileMapAddress - VRAMAddress.Start];
        this.fifoData.state = FIFOFetcherState.GetTileDataLow;
        return;
      }

      case FIFOFetcherState.GetTileDataLow: {
        const tileAreaBase = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? VRAMAddress.TileBlock3
          : VRAMAddress.TileBlock1;

        const offset = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? asI8(fetcher.tileIndex)
          : fetcher.tileIndex;

        let addr: number;

        if (this.fifoData.isDrawingWindow) {
          const rowOffset = fetcher.windowLineCounter % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        } else {
          const rowOffset = (this.LY.value + this.SCY.value) % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        }

        fetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        this.fifoData.state = FIFOFetcherState.GetTileDataHigh;
        return;
      }

      case FIFOFetcherState.GetTileDataHigh: {
        const isWindow = (
          this.LCDC.bit(LCDCBit.WindowEnable)
          && this.WY.value >= this.LY.value
          && this.WX.value >= this.fifoData.currentPixel
        );

        const tileAreaBase = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? VRAMAddress.TileBlock3
          : VRAMAddress.TileBlock1;

        const offset = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? asI8(fetcher.tileIndex)
          : fetcher.tileIndex;

        let addr: number;

        if (isWindow) {
          const rowOffset = fetcher.windowLineCounter % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        } else {
          const rowOffset = (this.LY.value + this.SCY.value) % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        }

        // TODO: No good reason to do this twice, unless of course there
        // it's possible that the LCDC register is modified between this fetch
        // and the previous one. This would basically amount to emulating really
        // weird and probably inadvisable game programming behaviour, but I suppose
        // it's not the emulator authors place to judge.
        fetcher.highByte = this.VRAM[addr + 1 - VRAMAddress.Start];

        // Fill the fetcher buffer with color information
        for (let i = 7; i >= 0; i--) {
          const b0 = ((fetcher.lowByte >> i) & 1);
          const b1 = ((fetcher.highByte >> i) & 1) << 1;
          fetcher.buffer.push({
            paletteIndex: b0 | b1
          });
        }

        // There is a bug that forces a second refetch at the beginning of each scanline, causing it to take
        // an extra 6 cycles before pushing pixels out of the fifo. This is what leads to a 172 cycle minimum
        // for mode 3.
        if (!fetcher.doubleBug) {
          fetcher.doubleBug = true;
          fetcher.buffer = [];
          this.fifoData.state = FIFOFetcherState.GetTile;
        } else {
          this.fifoData.state = FIFOFetcherState.Push;
        }

        return;
      }

      case FIFOFetcherState.Push: {
        if (this.fifoData.bgShiftRegister.length === 0) {
          this.fifoData.bgShiftRegister.push(...fetcher.buffer.map(x => x.paletteIndex));
          fetcher.pixel += 8;
          fetcher.x++;
          fetcher.buffer = [];
          this.fifoData.state = FIFOFetcherState.GetTile;
        }
        return;
      }
    }
  }

  private spriteFetch() {
    const {spriteFetcher} = this.fifoData;

    switch (spriteFetcher.state) {
      case FIFOFetcherState.GetTile: {
        // This is a no-op, since we already have this data stored from our OAM search
        spriteFetcher.state = FIFOFetcherState.GetTileDataLow;
        return;
      }

      case FIFOFetcherState.GetTileDataLow: {
        const tileAreaBase = VRAMAddress.TileBlock1;
        const offset = spriteFetcher.oamResult.tileIndex * BYTES_PER_TILE;
        const addr = tileAreaBase + offset + spriteFetcher.oamResult.lineOffsetLow;

        spriteFetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        spriteFetcher.state = FIFOFetcherState.GetTileDataHigh;
        return;
      }

      case FIFOFetcherState.GetTileDataHigh: {
        const tileAreaBase = VRAMAddress.TileBlock1;
        const offset = spriteFetcher.oamResult.tileIndex * BYTES_PER_TILE;

        // TODO: Account for the flip-y bit
        const addr = tileAreaBase + offset + spriteFetcher.oamResult.lineOffsetHigh;

        spriteFetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        spriteFetcher.highByte = this.VRAM[addr + 1 - VRAMAddress.Start];

        // Fill the fetcher buffer with information
        for (let i = 7; i >= 0; i--) {
          const b0 = ((spriteFetcher.lowByte >> i) & 1);
          const b1 = ((spriteFetcher.highByte >> i) & 1) << 1;
          spriteFetcher.buffer.push({
            colorIndex: b0 | b1,
            bgAndWindowOverSprite: Boolean(spriteFetcher.oamResult.flags & 0x80),
            useOBP1: Boolean(spriteFetcher.oamResult.flags & 0x10)
          });
        }

        // Reverse the buffer if the Flip-X bit is set
        if (spriteFetcher.oamResult.flags & 0x20) {
          spriteFetcher.buffer.reverse();
        }

        spriteFetcher.state = FIFOFetcherState.Push;
        return;
      }

      case FIFOFetcherState.Push: {
        if (this.fifoData.spriteShiftRegister.length === 0) {
          this.fifoData.spriteShiftRegister = [...spriteFetcher.buffer];
          spriteFetcher.buffer = [];
          spriteFetcher.state = FIFOFetcherState.GetTile;
          this.fifoData.spriteFetch = false;
        }
        return;
      }
    }
  }

  private pixelPipe(catchupCycles: number) {
    while (catchupCycles >= 2) {
      const {fetcher, spriteFetcher} = this.fifoData;

      if (this.fifoData.spriteFetch) {
        this.spriteFetch();
      } else {
        // Search for any sprite that should be rendered right now
        const sprite = this.OAMSearchBuffer.find(s => this.fifoData.currentPixel + 8 === s.x);
        if (sprite) {
          spriteFetcher.oamResult = sprite;
          this.fifoData.spriteFetch = true;
          this.spriteFetch();
        }
      }

      if (!this.fifoData.spriteFetch) {
        this.bgFetch();
      }

      for (let i = 0; i < 2; i++) {
        if (this.fifoData.bgShiftRegister.length > 0 && !this.fifoData.spriteFetch) {

          // TODO: This is still wrong - need to go one pixel at a time and decrement the
          // catchupCycles each time
          if (!this.fifoData.hasDiscardedPixels) {
            const scxMod8 = this.SCX.value % 8;
            this.fifoData.bgShiftRegister.splice(0, scxMod8);
            this.fifoData.hasDiscardedPixels = true;
          }

          const bgPaletteIndex = this.fifoData.bgShiftRegister.shift();
          const bgColorIndex = (this.BGP.value >> (bgPaletteIndex * 2)) & 0b11;
          const bgColor = colors[bgColorIndex];

          if (this.fifoData.spriteShiftRegister.length) {
            const {colorIndex, useOBP1, bgAndWindowOverSprite} = this.fifoData.spriteShiftRegister.shift();
            const palette = useOBP1 ? this.OBP1.value : this.OBP0.value;
            const spColorIndex = (palette >> (colorIndex * 2)) & 0b11;
            const spColor = colors[spColorIndex];

            // If this pixel is "transparent", draw the background pixel
            if (spColorIndex === 0 || (bgAndWindowOverSprite && bgColorIndex !== 0)) {
              this.screen.pushPixel(bgColor);
            } else {
              this.screen.pushPixel(spColor);
            }
          } else {
            this.screen.pushPixel(bgColor);
          }

          this.fifoData.currentPixel++;
          catchupCycles--;

          const isWindow = this.fifoData.windowLineActive || (
            this.LCDC.bit(LCDCBit.WindowEnable)
            && (this.fifoData.windowHasBegun || this.WY.value === this.LY.value)
            && this.fifoData.currentPixel >= this.WX.value - 7
          );

          if (isWindow) {
            fetcher.x = 0;
            this.fifoData.state = FIFOFetcherState.GetTile;
            this.fifoData.bgShiftRegister = [];
            this.fifoData.windowLineActive = true;
            this.fifoData.windowHasBegun = true;
            fetcher.buffer = [];
          }

          // If we reach the end of a line, jump out and allow a state change
          if (this.fifoData.currentPixel % PIXELS_PER_ROW === 0) {
            return catchupCycles;
          }
        } else {
          // Completely empty, wait to be loaded
          catchupCycles--;
        }
      }
    }

    return catchupCycles;
  }

  getVRAM() {
    return this.VRAM;
  }
};
