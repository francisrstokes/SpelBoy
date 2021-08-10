import { SpelBoy } from './../spelboy';
import { InputAddress } from './../input';
import { PPUMode, PPURegister, VRAMAddress, OAMAddress } from '../ppu';
import { bootRom } from '../bootrom';
import { TimerAddress } from '../timer';
import { InterruptAddress } from '../sharp-sm83';
import { ParsedHeader } from '../cart-parser';
import { MBCs, MBCAddress } from '../mbc';
import { MemoryBankController } from '../mbc/memory-bank-controller';

export enum GameBoyAddress {
  ROMBank0 = 0x0000,
  ROMBank1 = 0x4000,
  ERAMStart = 0xA000,
  ERAMEnd = 0xBFFF,
  WRAMStart = 0xC000,
  WRAMEnd = 0xDFFF,
  EchoRAMStart = 0xE000,
  EchoRAMEnd = 0xFDFF,
  HRAMStart = 0xFF80,
  HRAMEnd = 0xFFFE,

  BootROMLock = 0xFF50,

  OAM = 0xFE00,
  OAMEnd = 0xFE9F
}

// TODO: Describe a `addressInRange` function
export interface IMemoryInterface {
  read: (address: number) => number;
  write: (address: number, value: number) => void;
};

export class MemoryInterface implements IMemoryInterface {
  spelboy: SpelBoy;
  private memory = new Uint8Array(0xffff);

  bootRomMapped: boolean = true;

  private romBank0: Uint8Array = new Uint8Array(0x4000);
  private romBank1: Uint8Array = new Uint8Array(0x4000);
  private ram: Uint8Array = new Uint8Array(0x2000);
  private hram: Uint8Array = new Uint8Array(0x7F);

  private get ppu() { return this.spelboy.ppu; }
  private get timer() { return this.spelboy.timer; }
  private get cpu() { return this.spelboy.cpu; }
  private get input() { return this.spelboy.input; }

  private mbc: MemoryBankController;

  constructor(spelboy: SpelBoy) {
    this.spelboy = spelboy;
  }

  initialise(header: ParsedHeader, cart: Uint8Array) {
    if (header.cartridgeType.byte in MBCs) {
      this.mbc = MBCs[header.cartridgeType.byte](cart, header);
    } else {
      throw new Error(`Unsupported cartridge type: ${header.cartridgeType.description}`);
    }
  }

  loadROMBank0(data: Uint8Array) {
    if (data.byteLength > 0x4000) {
      throw new RangeError(`Bank0: ROM size exceeds bank capacity (size=${data.byteLength})`);
    }
    for (let i = 0; i < data.length; i++) {
      this.romBank0[i] = data[i];
    }
  }

  loadROMBank1(data: Uint8Array) {
    if (data.byteLength > 0x4000) {
      throw new RangeError(`Bank1: ROM size exceeds bank capacity (size=${data.byteLength})`);
    }
    for (let i = 0; i < data.length; i++) {
      this.romBank1[i] = data[i];
    }
  }

  read(address: number, isDMARead: boolean = false) {
    // During DMA, the CPU can only access HRAM
    if (!isDMARead && this.ppu && this.ppu.DMAInProgress) {
      if (address >= GameBoyAddress.HRAMStart && address <= GameBoyAddress.HRAMEnd) {
        return this.hram[address - GameBoyAddress.HRAMStart];
      }
      return 0xff;
    }

    if (address < 0x100 && this.bootRomMapped) {
      return bootRom[address];
    }

    if (address >= MBCAddress.ROMStart && address <= MBCAddress.ROMEnd) {
      return this.mbc.read(address);
    }

    if (address >= MBCAddress.ERAMStart && address <= MBCAddress.ERAMEnd) {
      return this.mbc.read(address);
    }

    if (address >= GameBoyAddress.WRAMStart && address <= GameBoyAddress.WRAMEnd) {
      return this.ram[address - GameBoyAddress.WRAMStart];
    }
    if (address >= GameBoyAddress.EchoRAMStart && address <= GameBoyAddress.EchoRAMEnd) {
      return this.ram[address - GameBoyAddress.EchoRAMStart];
    }
    if (address >= GameBoyAddress.HRAMStart && address <= GameBoyAddress.HRAMEnd) {
      return this.hram[address - GameBoyAddress.HRAMStart];
    }

    if (address >= PPURegister.Start && address <= PPURegister.End) {
      return this.ppu.read(address);
    }

    if (address >= OAMAddress.Start && address <= OAMAddress.End) {
      const mode = this.ppu.getMode();
      if (mode === PPUMode.HBlank || mode === PPUMode.VBlank) {
        return this.ppu.read(address);
      }
      return 0xff;
    }

    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      const mode = this.ppu.getMode();
      if (mode === PPUMode.HBlank || mode === PPUMode.VBlank || mode === PPUMode.OAMSearch) {
        return this.ppu.read(address);
      }
      return 0xff;
    }

    if (address >= TimerAddress.Start && address <= TimerAddress.End) {
      return this.timer.read(address);
    }

    if (address === InterruptAddress.IE || address === InterruptAddress.IF) {
      return this.cpu.read(address);
    }

    if (address === InputAddress.P1) {
      return this.input.read(address);
    }

    switch (address) {
      case GameBoyAddress.BootROMLock: return this.bootRomMapped ? 0 : 1;
    }

    return this.memory[address];
  }

  write(address: number, value: number) {
    // During DMA, the CPU can only access HRAM
    if (this.ppu.DMAInProgress) {
      if (address >= GameBoyAddress.HRAMStart && address <= GameBoyAddress.HRAMEnd) {
        this.hram[address - GameBoyAddress.HRAMStart] = value;
      }
      return
    }

    // Writing to ROM can have side effects depending on the MBC (if any)
    if (address >= MBCAddress.ROMStart && address <= MBCAddress.ROMEnd) {
      this.mbc.write(address, value);
      return;
    }

    if (address >= MBCAddress.ERAMStart && address <= MBCAddress.ERAMEnd) {
      this.mbc.write(address, value);
      return;
    }

    if (address >= GameBoyAddress.WRAMStart && address <= GameBoyAddress.WRAMEnd) {
      this.ram[address - GameBoyAddress.WRAMStart] = value;
      return;
    }
    if (address >= GameBoyAddress.EchoRAMStart && address <= GameBoyAddress.EchoRAMEnd) {
      this.ram[address - GameBoyAddress.EchoRAMStart] = value;
      return;
    }
    if (address >= GameBoyAddress.HRAMStart && address <= GameBoyAddress.HRAMEnd) {
      this.hram[address - GameBoyAddress.HRAMStart] = value;
      return;
    }

    if (address >= PPURegister.Start && address <= PPURegister.End) {
      if (this.ppu) {
        return this.ppu.write(address, value);
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= OAMAddress.Start && address <= OAMAddress.End) {
      const mode = this.ppu.getMode();
      if (mode === PPUMode.HBlank || mode === PPUMode.VBlank) {
        return this.ppu.write(address, value);
      }
      return 0xff;
    }

    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      const mode = this.ppu.getMode();
      if (mode === PPUMode.HBlank || mode === PPUMode.VBlank || mode === PPUMode.OAMSearch) {
        return this.ppu.write(address, value);
      }
      return 0xff;
    }

    if (address >= TimerAddress.Start && address <= TimerAddress.End) {
      return this.timer.write(address, value);
    }

    if (address === InterruptAddress.IE || address === InterruptAddress.IF) {
      return this.cpu.write(address, value);
    }

    if (address === InputAddress.P1) {
      return this.input.write(address, value);
    }

    switch (address) {
      case GameBoyAddress.BootROMLock: {
        if (!this.bootRomMapped) return;
        if (value) this.bootRomMapped = false;
        return;
      }
    }

    this.memory[address] = value;
  }
};
