import { Register } from './register';

enum GameBoyAddress {
  InteruptEnable = 0xffff,
  InteruptFlag = 0xff0f,

  PPUControl = 0xff40,
  PPUStatus = 0xff41,
  SCY = 0xff42,
  SCX = 0xff43,
  LY = 0xff44,
  LYC = 0xff45,

  JOYPAD_P1 = 0xff00,

  DIV = 0xFF04,
  TIMA = 0xFF05,
  TMA = 0xFF06,
  TAC = 0xFF07,

  DMA = 0xFF46,
  BGP = 0xFF47,
  OBP0 = 0xFF48,
  OBP1 = 0xFF49,

  TileBlock1 = 0x8000,
  TileBlock1End = 0x87FF,
  TileBlock2 = 0x8800,
  TileBlock2End = 0x8FFF,
  TileBlock3 = 0x9000,
  TileBlock3End = 0x97FF,

  TileMap1 = 0x9800,
  TileMap1End = 0x9BFF,
  TileMap2 = 0x9C00,
  TileMap2End = 0x9FFF,

  OAM = 0xFE00,
  OAMEnd = 0xFE9F
}

export interface IMemoryInterface {
  read: (address: number) => number;
  write: (address: number, value: number) => void;
};

export class MemoryInterface implements IMemoryInterface {
  private IE = new Register(0xff);
  private IF = new Register(0x00);
  private LCDC = new Register(0x00);
  private LCDC_PPU = new Register(0x00);
  private SCY = new Register(0x00);
  private SCX = new Register(0x00);
  private LY = new Register(0x00);
  private LYC = new Register(0x00);
  private JOYPAD_P1 = new Register(0x00);
  private DMA = new Register(0x00);
  private BGP = new Register(0x00); // TODO: Initial value?
  private OBP0 = new Register(0x00); // TODO: Initial value?
  private OBP1 = new Register(0x00); // TODO: Initial value?
  private DIV = new Register(0x00); // TODO: Initial value?
  private TIMA = new Register(0x00); // TODO: Initial value?
  private TMA = new Register(0x00); // TODO: Initial value?
  private TAC = new Register(0x00); // TODO: Initial value?

  read(address: number) {
    switch (address) {
      case GameBoyAddress.InteruptEnable: return this.IE.value;
      case GameBoyAddress.InteruptFlag: return this.IF.value;
      case GameBoyAddress.PPUControl: return this.LCDC.value;
      case GameBoyAddress.PPUStatus: return this.LCDC_PPU.value | 0x80;
      case GameBoyAddress.SCY: return this.SCY.value;
      case GameBoyAddress.SCX: return this.SCX.value;
      case GameBoyAddress.LY: return this.LY.value;
      case GameBoyAddress.LYC: return this.LYC.value;
      case GameBoyAddress.JOYPAD_P1: return this.JOYPAD_P1.value | 0xC0;
      case GameBoyAddress.DMA: return this.DMA.value;
      case GameBoyAddress.BGP: return this.BGP.value;
      case GameBoyAddress.OBP0: return this.OBP0.value;
      case GameBoyAddress.OBP1: return this.OBP1.value;
      case GameBoyAddress.DIV: return this.DIV.value;
      case GameBoyAddress.TIMA: return this.TIMA.value;
      case GameBoyAddress.TMA: return this.TMA.value;
      case GameBoyAddress.TAC: return this.TMA.value;
    }

    return 0;
  }

  write(address: number, value: number) {
    switch (address) {
      case GameBoyAddress.InteruptEnable: { this.IE.value = value; return; }
      case GameBoyAddress.InteruptEnable: { this.IF.value = value; return; }
      case GameBoyAddress.PPUControl: { this.LCDC.value = value; return; }
      case GameBoyAddress.PPUStatus: { this.LCDC_PPU.value = value; return; }
      case GameBoyAddress.SCY: { this.SCY.value = value; return; }
      case GameBoyAddress.SCX: { this.SCX.value = value; return; }
      case GameBoyAddress.LY: { this.LY.value = value; return; }
      case GameBoyAddress.LYC: { this.LYC.value = value; return; }
      case GameBoyAddress.JOYPAD_P1: { this.JOYPAD_P1.value = (value & 0x30); return; }
      case GameBoyAddress.DMA: {
        this.DMA.value = value;
        this.initiateDMA();
        return;
      }
      case GameBoyAddress.BGP: { this.BGP.value = value; return; }
      case GameBoyAddress.OBP0: { this.OBP0.value = value; return; }
      case GameBoyAddress.OBP1: { this.OBP1.value = value; return; }

      case GameBoyAddress.DIV: { this.DIV.value = 0; return; }
      case GameBoyAddress.TIMA: { this.TIMA.value = value; return; }
      case GameBoyAddress.TMA: { this.TMA.value = value; return; }
    }
  }

  private initiateDMA() {}
};
