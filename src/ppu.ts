import { SpelBoy } from './spelboy';
import { Color } from './pixel-canvas';
import { asI8, toHexString } from './utils';
import { IMemoryInterface } from './memory-interface';
import { Register8 } from './memory-interface/register';
import { InterruptType } from './sharp-sm83';

const WHITE: Color = [0xff, 0xff, 0xff];
const colors: Color[] = [
  WHITE,
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

export enum StatBit {
  ModeBit0,
  ModeBit1,
  LYC_LY,
  Mode0HBlankInterruptSource,
  Mode1VBlankInterruptSource,
  Mode2OAMInterruptSource,
  LYC_LYInterruptSource,
  Unused,
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
  WY = 0xFF4A,
  WX = 0xFF4B,

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

export enum FetcherState {
  GetTile,
  GetTileDataLow,
  GetTileDataHigh,
  Push,
}

export enum SpriteFlags {
  Palette0              = 0x00,
  Palette1              = 0x01,
  Palette3              = 0x02,
  TileVRAMBank          = 0x04,
  UseOBP1               = 0x10,
  FlipX                 = 0x20,
  FlipY                 = 0x40,
  BGAndWindowOverSprite = 0x80,
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
  state: FetcherState;
  oamResult: OAMSearchResult;
  lowByte: number;
  highByte: number;
  buffer: Array<SpriteData>;
  active: boolean;
}

type BGFetcher = {
  state: FetcherState;
  tileIndex: number;
  lowByte: number;
  highByte: number;
  buffer: Array<number>;
  pixelX: number;
  windowLineCounter: number;
  doubleBug: boolean;
};

type SpriteData = {
  colorIndex: number;
  bgAndWindowOverSprite: boolean;
  useOBP1: boolean;
};

type PixelPushData = {
  bgFetcher: BGFetcher;
  bgShiftRegister: Array<number>;

  spriteFetcher: SpriteFetcher;
  spriteShiftRegister: Array<SpriteData>;

  windowHasBegunThisFrame: boolean;
  windowIsActiveThisScanline: boolean;

  currentPixelX: number;
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

  private pixelData: PixelPushData;

  private get cpu() { return this.spelboy.cpu; }
  private get clock() { return this.spelboy.clock; }
  private get memory() { return this.spelboy.memory; }
  private get screen() { return this.spelboy.screen; }

  constructor(spelboy: SpelBoy) {
    this.spelboy = spelboy;
    this.resetFifoData();

    // A register callback is used here because the LY register is not actually writable via the MMIO
    // interface. Internally, there are several places we'd need to include this logic otherwise.
    // A callback like this obscures the code a little, since it's side effects can't easily be seen in
    // the actual codepath, but it seems to make sense for this specific context
    this.LY.onWrite(ly => {
      if (ly === this.LYC.value) {
        this.STAT.setBit(StatBit.LYC_LY);

        // Check if we're supposed to send out an interrupt on equality
        if (this.STAT.bit(StatBit.LYC_LYInterruptSource)) {
          this.cpu.requestInterrupt(InterruptType.LCDSTAT);
        }
      } else {
        this.STAT.clearBit(StatBit.LYC_LY);
      }
    });
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

        // Going from on to off
        if (this.isEnabled && !enabled) {
          this.STAT.value &= 0xfc; // Set mode flag to 00b
          this.LY.value = 0;
          this.resetFifoData();
        // Going from off to on
        } else if (!this.isEnabled && enabled) {
          this.STAT.value = (this.STAT.value & 0xfe) | PPUMode.OAMSearch;
          this.lastUpdatedAtCycle = this.clock.cycles;
        }

        this.isEnabled = enabled;
        this.LCDC.value = value;
        return;
      }
      case PPURegister.STAT: { this.STAT.value = value; return; }
      case PPURegister.SCY: { this.SCY.value = value; return; }
      case PPURegister.SCX: { this.SCX.value = value; return; }
      case PPURegister.LY: { return; }
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
      case PPURegister.WX: { this.WX.value = value; return; }
      case PPURegister.WY: { this.WY.value = value; return; }
      default: {
        throw new Error(`Write to unhandled address: ${toHexString(address)}=${value}`);
      }
    }
  }

  getMode() {
    return (this.STAT.value & 0b11) as PPUMode;
  }

  private resetFifoData() {
    this.pixelData = {
      bgFetcher: {
        doubleBug: false,
        pixelX: 0,
        windowLineCounter: -1,
        buffer: [],
        highByte: 0,
        lowByte: 0,
        state: FetcherState.GetTile,
        tileIndex: 0
      },
      spriteFetcher: {
        state: FetcherState.GetTile,
        buffer: [],
        active: false,
        highByte: 0,
        lowByte: 0,
        oamResult: null
      },
      bgShiftRegister: [],
      spriteShiftRegister: [],
      currentPixelX: 0,
      hasDiscardedPixels: false,
      windowHasBegunThisFrame: false,
      windowIsActiveThisScanline: false,

      pixelsToDiscard: 0
    }
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

            // Reset the line-based pixel data values
            this.pixelData.bgShiftRegister = [];
            this.pixelData.bgFetcher.pixelX = 0;
            this.pixelData.bgFetcher.buffer = [];
            this.pixelData.bgFetcher.doubleBug = false;
            this.pixelData.bgFetcher.state = FetcherState.GetTile;

            this.pixelData.currentPixelX = 0;
            this.pixelData.windowIsActiveThisScanline = false;
            this.pixelData.hasDiscardedPixels = false;
            this.pixelData.pixelsToDiscard = 0;

            this.pixelData.spriteShiftRegister = [];
            this.pixelData.spriteFetcher.active = false;
            this.pixelData.spriteFetcher.buffer = [];
            this.pixelData.spriteFetcher.state = FetcherState.GetTile;

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
            this.pixelData.currentPixelX > 0
            && this.pixelData.currentPixelX % PIXELS_PER_ROW === 0
            && this.cyclesSpentInMode > 0
          );

          if (isEndOfLine) {
            // console.log(`Drawing done for line ${this.LY.value} in ${this.cyclesSpentInMode} cycles (${this.cyclesInScanline} total this line)`);
            this.cyclesSpentInMode = 0;

            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.HBlank;

            // Request the interrupt on the STAT line if the corresponding bit is set
            if (this.STAT.bit(StatBit.Mode0HBlankInterruptSource)) {
              this.cpu.requestInterrupt(InterruptType.LCDSTAT);
            }
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
          this.pixelData.hasDiscardedPixels = false;

          if (this.LY.value === 144) {
            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.VBlank;

            this.cpu.requestInterrupt(InterruptType.VBlank);

            // Also request the interrupt on the STAT line if the corresponding bit is set
            if (this.STAT.bit(StatBit.Mode1VBlankInterruptSource)) {
              this.cpu.requestInterrupt(InterruptType.LCDSTAT);
            }

            // Reset the frame-specific pixel data values
            this.pixelData.bgFetcher.windowLineCounter = -1;
            this.pixelData.windowHasBegunThisFrame = false;

            this.screen.draw();
          } else {
            this.STAT.value = (this.STAT.value & 0xfc) | PPUMode.OAMSearch;

            // Request the interrupt on the STAT line if the corresponding bit is set
            if (this.STAT.bit(StatBit.Mode2OAMInterruptSource)) {
              this.cpu.requestInterrupt(InterruptType.LCDSTAT);
            }
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
    const {bgFetcher} = this.pixelData;
    // Each step here takes two cycles - and runs in tandem with pixel pushes
    // The coordination is done by the pixelPipe method, and so fetching does not
    // run in a loop, but is executed externally one step at a time

    // TODO: Implement window
    switch (this.pixelData.bgFetcher.state) {
      case FetcherState.GetTile: {
        let tileMapAddress: number;

        if (this.pixelData.windowIsActiveThisScanline) {
          const windowTileMapBase = this.LCDC.bit(LCDCBit.WindowTileMapArea) === 0
            ? VRAMAddress.TileMap0
            : VRAMAddress.TileMap1;

          const yOffset = TILES_PER_MAP_ROW * (bgFetcher.windowLineCounter >> 3);
          tileMapAddress = windowTileMapBase + (bgFetcher.pixelX >> 3) + yOffset;
        } else {
          const bgTileMapBase = this.LCDC.bit(LCDCBit.BGTileMapArea) === 0
            ? VRAMAddress.TileMap0
            : VRAMAddress.TileMap1;

          const xOffset = (((bgFetcher.pixelX + this.SCX.value) & 0xff) >> 3);
          const yOffset = TILES_PER_MAP_ROW * (((this.LY.value + this.SCY.value) & 0xff) >> 3);
          tileMapAddress = bgTileMapBase + xOffset + yOffset;
        }

        bgFetcher.tileIndex = this.VRAM[tileMapAddress - VRAMAddress.Start];
        this.pixelData.bgFetcher.state = FetcherState.GetTileDataLow;
        return;
      }

      case FetcherState.GetTileDataLow: {
        const tileAreaBase = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? VRAMAddress.TileBlock3
          : VRAMAddress.TileBlock1;

        const offset = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? asI8(bgFetcher.tileIndex)
          : bgFetcher.tileIndex;

        let addr: number;

        if (this.pixelData.windowIsActiveThisScanline) {
          const rowOffset = bgFetcher.windowLineCounter % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        } else {
          const rowOffset = (this.LY.value + this.SCY.value) % PIXELS_PER_TILE;
          addr = tileAreaBase + (offset * BYTES_PER_TILE) + (rowOffset * 2);
        }

        bgFetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        this.pixelData.bgFetcher.state = FetcherState.GetTileDataHigh;
        return;
      }

      case FetcherState.GetTileDataHigh: {
        const tileAreaBase = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? VRAMAddress.TileBlock3
          : VRAMAddress.TileBlock1;

        const offset = this.LCDC.bit(LCDCBit.BGAndWindowTileDataArea) === 0
          ? asI8(bgFetcher.tileIndex)
          : bgFetcher.tileIndex;

        let addr: number;

        if (this.pixelData.windowIsActiveThisScanline) {
          const rowOffset = bgFetcher.windowLineCounter % PIXELS_PER_TILE;
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
        bgFetcher.highByte = this.VRAM[addr + 1 - VRAMAddress.Start];

        // Fill the fetcher buffer with color information
        for (let i = 7; i >= 0; i--) {
          const b0 = ((bgFetcher.lowByte >> i) & 1);
          const b1 = ((bgFetcher.highByte >> i) & 1) << 1;
          bgFetcher.buffer.push(b0 | b1);
        }

        // There is a bug that forces a second refetch at the beginning of each scanline, causing it to take
        // an extra 6 cycles before pushing pixels out of the fifo. This is what leads to a 172 cycle minimum
        // for mode 3.
        if (!bgFetcher.doubleBug) {
          bgFetcher.doubleBug = true;
          bgFetcher.buffer = [];
          this.pixelData.bgFetcher.state = FetcherState.GetTile;
        } else {
          this.pixelData.bgFetcher.state = FetcherState.Push;
        }

        return;
      }

      case FetcherState.Push: {
        if (this.pixelData.bgShiftRegister.length === 0) {
          this.pixelData.bgShiftRegister.push(...bgFetcher.buffer);
          bgFetcher.pixelX += 8;
          bgFetcher.buffer = [];
          this.pixelData.bgFetcher.state = FetcherState.GetTile;
        }
        return;
      }
    }
  }

  private spriteFetch() {
    const {spriteFetcher} = this.pixelData;

    switch (spriteFetcher.state) {
      case FetcherState.GetTile: {
        // This is a no-op, since we already have this data stored from our OAM search
        spriteFetcher.state = FetcherState.GetTileDataLow;
        return;
      }

      case FetcherState.GetTileDataLow: {
        const tileAreaBase = VRAMAddress.TileBlock1;
        const offset = spriteFetcher.oamResult.tileIndex * BYTES_PER_TILE;
        const size = (this.LCDC.bit(LCDCBit.OBJSize) ? 8 : 16) - 1;
        const lineOffset =  Boolean(spriteFetcher.oamResult.flags & SpriteFlags.FlipY)
          ? (2 * size - spriteFetcher.oamResult.lineOffsetLow)
          : spriteFetcher.oamResult.lineOffsetLow;

        const addr = tileAreaBase + offset + lineOffset;

        spriteFetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        spriteFetcher.state = FetcherState.GetTileDataHigh;
        return;
      }

      case FetcherState.GetTileDataHigh: {
        const tileAreaBase = VRAMAddress.TileBlock1;
        const offset = spriteFetcher.oamResult.tileIndex * BYTES_PER_TILE;

        const size = (this.LCDC.bit(LCDCBit.OBJSize) ? 16 : 8) - 1;
        const lineOffset =  Boolean(spriteFetcher.oamResult.flags & SpriteFlags.FlipY)
          ? (2 * size - spriteFetcher.oamResult.lineOffsetHigh)
          : spriteFetcher.oamResult.lineOffsetHigh;

          const addr = tileAreaBase + offset + lineOffset;

        spriteFetcher.lowByte = this.VRAM[addr - VRAMAddress.Start];
        spriteFetcher.highByte = this.VRAM[addr + 1 - VRAMAddress.Start];

        // Fill the fetcher buffer with information
        for (let i = 7; i >= 0; i--) {
          const b0 = ((spriteFetcher.lowByte >> i) & 1);
          const b1 = ((spriteFetcher.highByte >> i) & 1) << 1;
          spriteFetcher.buffer.push({
            colorIndex: b0 | b1,
            bgAndWindowOverSprite: Boolean(spriteFetcher.oamResult.flags & SpriteFlags.BGAndWindowOverSprite),
            useOBP1: Boolean(spriteFetcher.oamResult.flags & SpriteFlags.UseOBP1)
          });
        }

        // Reverse the buffer if the Flip-X bit is set
        if (spriteFetcher.oamResult.flags & SpriteFlags.FlipX) {
          spriteFetcher.buffer.reverse();
        }

        spriteFetcher.state = FetcherState.Push;
        return;
      }

      case FetcherState.Push: {
        if (this.pixelData.spriteShiftRegister.length === 0) {
          this.pixelData.spriteShiftRegister = [...spriteFetcher.buffer];
          spriteFetcher.buffer = [];
          spriteFetcher.state = FetcherState.GetTile;
          this.pixelData.spriteFetcher.active = false;
        }
        return;
      }
    }
  }

  private pixelPipe(catchupCycles: number) {
    while (catchupCycles >= 2) {
      const {bgFetcher, spriteFetcher} = this.pixelData;

      if (this.pixelData.spriteFetcher.active) {
        this.spriteFetch();
      } else if (this.pixelData.spriteShiftRegister.length < 8) {
        // Search for any sprite that should be rendered right now
        const sprite = this.OAMSearchBuffer.find(s => this.pixelData.currentPixelX + 8 === s.x);
        if (sprite) {
          spriteFetcher.oamResult = sprite;
          this.pixelData.spriteFetcher.active = true;
          this.spriteFetch();
        }
      }

      if (!this.pixelData.spriteFetcher.active) {
        this.bgFetch();
      }

      for (let i = 0; i < 2; i++) {
        // TODO: Confirm that this is the only condition for proceeding with the pixel pipe
        if (this.pixelData.bgShiftRegister.length > 0) {

          // TODO: This is still wrong - need to go one pixel at a time and decrement the
          // catchupCycles each time
          if (!this.pixelData.hasDiscardedPixels) {
            const scxMod8 = this.SCX.value % 8;
            this.pixelData.bgShiftRegister.splice(0, scxMod8);
            this.pixelData.hasDiscardedPixels = true;
          }

          const bgPaletteIndex = this.pixelData.bgShiftRegister.shift();
          const bgColorIndex = (this.BGP.value >> (bgPaletteIndex * 2)) & 0b11;
          const bgColor = colors[bgColorIndex];

          if (this.pixelData.spriteShiftRegister.length) {
            const {colorIndex, useOBP1, bgAndWindowOverSprite} = this.pixelData.spriteShiftRegister.shift();
            const palette = useOBP1 ? this.OBP1.value : this.OBP0.value;
            const spColorIndex = (palette >> (colorIndex * 2)) & 0b11;
            const spColor = colors[spColorIndex];

            const spritesEnabled = this.LCDC.bit(LCDCBit.OBJEnable);
            const bgEnabled = this.LCDC.bit(LCDCBit.BGAndWindowEnablePriority);

            // If this pixel is "transparent", draw the background pixel
            if (!spritesEnabled || colorIndex === 0 || (bgAndWindowOverSprite && bgColorIndex !== 0)) {
              if (!bgEnabled) {
                this.screen.pushPixel(WHITE);
              } else {
                this.screen.pushPixel(bgColor);
              }
            } else {
              this.screen.pushPixel(spColor);
            }
          } else {
            const bgEnabled = this.LCDC.bit(LCDCBit.BGAndWindowEnablePriority);
            if (!bgEnabled) {
              this.screen.pushPixel(WHITE);
            } else {
              this.screen.pushPixel(bgColor);
            }
          }

          this.pixelData.currentPixelX++;
          catchupCycles--;

          const isWindow = this.pixelData.windowIsActiveThisScanline || (
            this.LCDC.bit(LCDCBit.WindowEnable)
            && (this.pixelData.windowHasBegunThisFrame || (this.WY.value === this.LY.value))
            && (this.pixelData.currentPixelX >= this.WX.value - 7)
          );

          if (isWindow && !this.pixelData.windowIsActiveThisScanline) {
            this.pixelData.bgShiftRegister = [];
            bgFetcher.pixelX = 0;
            bgFetcher.buffer = [];
            bgFetcher.state = FetcherState.GetTile;
            bgFetcher.windowLineCounter++;
            this.pixelData.windowIsActiveThisScanline = true;
            this.pixelData.windowHasBegunThisFrame = true;
          }

          // If we reach the end of a line, jump out and allow a state change
          if (this.pixelData.currentPixelX % PIXELS_PER_ROW === 0) {
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
