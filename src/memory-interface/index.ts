import { InputAddress } from './../input';
import { PPU, PPUMode, PPURegister, VRAMAddress, OAMAddress } from '../ppu';
import { Register8 } from './register';
import { bootRom } from '../bootrom';
import { Timer, TimerAddress } from '../timer';
import { InterruptAddress, SM83 } from '../sharp-sm83';
import { Input } from '../input';

export enum GameBoyAddress {
  ROMBank0 = 0x0000,
  ROMBank1 = 0x4000,
  ExternalRAM = 0xA000,
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
  private ppu?: PPU;
  private timer?: Timer;
  private cpu?: SM83;
  private input?: Input;
  private memory = new Uint8Array(0xffff);

  /*private*/ bootRomMapped: boolean = true;

  private romBank0: Uint8Array = new Uint8Array(0x4000);
  private romBank1: Uint8Array = new Uint8Array(0x4000);
  private ram: Uint8Array = new Uint8Array(0x2000);
  private hram: Uint8Array = new Uint8Array(0x7F);

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

    if (address < 0x4000) return this.romBank0[address];
    if (address < 0x8000) return this.romBank1[address - 0x4000];
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
      if (this.ppu) {
        return this.ppu.read(address);
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= OAMAddress.Start && address <= OAMAddress.End) {
      if (this.ppu) {
        const mode = this.ppu.getMode();

        if (mode === PPUMode.HBlank || mode === PPUMode.VBlank) {
          return this.ppu.read(address);
        }

        return 0xff;
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      if (this.ppu) {
        const mode = this.ppu.getMode();

        if (mode === PPUMode.HBlank || mode === PPUMode.VBlank || mode === PPUMode.OAMSearch) {
          return this.ppu.read(address);
        }

        return 0xff;
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= TimerAddress.Start && address <= TimerAddress.End) {
      if (this.timer) {
        return this.timer.read(address);
      }
      throw new Error('No timer attached to memory interface.');
    }

    if (address === InterruptAddress.IE || address === InterruptAddress.IF) {
      if (this.cpu) {
        return this.cpu.read(address);
      }
      throw new Error('No CPU attached to memory interface.');
    }

    if (address === InputAddress.P1) {
      if (this.input) {
        return this.input.read(address);
      }
      throw new Error('No Input attached to memory interface.');
    }

    switch (address) {
      case GameBoyAddress.BootROMLock: return this.bootRomMapped ? 0 : 1;
    }

    return this.memory[address];
  }

  write(address: number, value: number) {
    // During DMA, the CPU can only access HRAM
    if (this.ppu && this.ppu.DMAInProgress) {
      if (address >= GameBoyAddress.HRAMStart && address <= GameBoyAddress.HRAMEnd) {
        this.hram[address - GameBoyAddress.HRAMStart] = value;
      }
      return
    }

    // Can't write to ROM
    if (address < 0x8000) return;

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
      if (this.ppu) {
        const mode = this.ppu.getMode();

        if (mode === PPUMode.HBlank || mode === PPUMode.VBlank) {
          return this.ppu.write(address, value);
        }

        return 0xff;
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= VRAMAddress.Start && address <= VRAMAddress.End) {
      if (this.ppu) {
        const mode = this.ppu.getMode();

        if (mode === PPUMode.HBlank || mode === PPUMode.VBlank || mode === PPUMode.OAMSearch) {
          return this.ppu.write(address, value);
        }

        return 0xff;
      }
      throw new Error('No PPU attached to memory interface.');
    }

    if (address >= TimerAddress.Start && address <= TimerAddress.End) {
      if (this.timer) {
        return this.timer.write(address, value);
      }
      throw new Error('No timer attached to memory interface.');
    }

    if (address === InterruptAddress.IE || address === InterruptAddress.IF) {
      if (this.cpu) {
        return this.cpu.write(address, value);
      }
      throw new Error('No CPU attached to memory interface.');
    }

    if (address === InputAddress.P1) {
      if (this.input) {
        return this.input.write(address, value);
      }
      throw new Error('No Input attached to memory interface.');
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

  private initiateDMA() {}

  connect(cpu: SM83, ppu: PPU, input: Input, timer: Timer) {
    this.cpu = cpu;
    this.ppu = ppu;
    this.input = input;
    this.timer = timer;
  }
};
