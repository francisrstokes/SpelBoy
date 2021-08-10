import { SpelBoy } from './../spelboy';
import { InputAddress } from './../input';
import { PPUMode, PPURegister, VRAMAddress, OAMAddress } from '../ppu';
import { bootRom } from '../bootrom';
import { TimerAddress } from '../timer';
import { InterruptAddress } from '../sharp-sm83';
import { ParsedHeader } from '../cart-parser';
import { CartridgeType } from '../cart-parser/tables';

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

enum MBC1Mode {
  Default = 0x00,
  RAMBanking = 0x01,
  // TODO: Advanced ROM Banking mode (value equivilent to RAMBanking)
}

// TODO: Describe a `addressInRange` function
export interface IMemoryInterface {
  read: (address: number) => number;
  write: (address: number, value: number) => void;
};

export class MemoryInterface implements IMemoryInterface {
  spelboy: SpelBoy;
  private memory = new Uint8Array(0xffff);

  /*private*/ bootRomMapped: boolean = true;

  private romBank0: Uint8Array = new Uint8Array(0x4000);
  private romBank1: Uint8Array = new Uint8Array(0x4000);
  private ram: Uint8Array = new Uint8Array(0x2000);
  private eram: Uint8Array[] = [];
  private hram: Uint8Array = new Uint8Array(0x7F);

  private get ppu() { return this.spelboy.ppu; }
  private get timer() { return this.spelboy.timer; }
  private get cpu() { return this.spelboy.cpu; }
  private get input() { return this.spelboy.input; }

  private cartridgeType: CartridgeType;
  private mbcMode: MBC1Mode = MBC1Mode.Default;
  private numROMBanks: number = 0;
  private ERAMEnabled: boolean = false;
  private hasERAM: boolean = false;
  private numERAMBanks: number = 0;
  private extraROMBits: number = 0;
  private ERAMIndex: number = 0;

  constructor(spelboy: SpelBoy) {
    this.spelboy = spelboy;
  }

  initialise(header: ParsedHeader, cart: Uint8Array) {
    if (header.cartridgeType.byte === CartridgeType.ROM_ONLY) {
      this.loadROMBank0(cart.slice(0, 0x4000));
      this.loadROMBank1(cart.slice(0x4000, 0x8000));
      this.cartridgeType = CartridgeType.ROM_ONLY;
    } else if ([CartridgeType.MBC1, CartridgeType.MBC1_RAM].includes(header.cartridgeType.byte)) {
      this.loadROMBank0(cart.slice(0, 0x4000));
      this.loadROMBank1(cart.slice(0x4000, 0x8000));

      this.cartridgeType = CartridgeType.MBC1;
      this.numROMBanks = header.rom.banks;

      if (header.ram.banks > 0) {
        this.hasERAM = true;
        this.numERAMBanks = header.ram.banks;
        this.eram = Array.from({ length: this.numERAMBanks }, () => new Uint8Array(0x2000));
        // TODO: In future, it would be more "accurate" to randomise the contents of this RAM
      }
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

    if (address < 0x4000) return this.romBank0[address];
    if (address < 0x8000) return this.romBank1[address - 0x4000];

    if (address >= GameBoyAddress.ERAMStart && address <= GameBoyAddress.ERAMEnd) {
      if (this.hasERAM && this.ERAMEnabled) {
        return this.eram[this.ERAMIndex][address - GameBoyAddress.ERAMStart];
      }
      return 0xff;
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
    if (address < 0x8000) {
      switch (this.cartridgeType) {

        case CartridgeType.MBC1: {
          // RAM Enable
          if (address < 0x2000) {
            this.ERAMEnabled = value === 0x0a;
            return;
          }

          // ROM Bank Number
          if (address < 0x4000) {
            // TODO: There is a specific behaviour when dealing with a very large number of ROM banks
            // that involves treating the bits differently

            // Only the bottom 5 bits are used to select a bank here. If there are more than 31 banks
            // then an additional two bits are used from the "RAM Bank Number / Extra bits for ROM Select"
            // register
            const correctedBankBase = (value & 0x1f) === 0 ? 1 : (value & 0x1f);

            const bitsRequiredForROMSelect = Math.ceil(Math.log2(this.numROMBanks));
            let bankNum = 0;
            if (bitsRequiredForROMSelect > 5) {
              bankNum = (this.extraROMBits << 5) | correctedBankBase;
            } else {
              const mask = (1 << bitsRequiredForROMSelect) - 1;
              bankNum = correctedBankBase & mask;
              if (bankNum === 0) {
                bankNum = 1;
              }
            }

            const cartOffset = bankNum * 0x4000;
            this.loadROMBank1(this.spelboy.cart.slice(cartOffset, cartOffset + 0x4000));

            return;
          }

          // RAM Bank Number / Extra bits for ROM Select
          if (address < 0x6000) {
            if (this.mbcMode === MBC1Mode.Default) {
              this.extraROMBits = value & 0b11;
              return;
            }

            // Is this RAM select?
            if (this.numERAMBanks > 0) {
              const mask = (1 << Math.ceil(Math.log2(this.numERAMBanks))) - 1;
              const maskedIndex = value & mask;

              // TODO: What is the appropriate behaviour here?
              if (maskedIndex >= this.numERAMBanks) {
                throw new Error(`ERAM selection index out of bounds (${maskedIndex})`);
              }

              this.ERAMIndex = maskedIndex;
            }
            return;
          }

          // Banking Mode Select
          if (address < 0x8000) {
            this.mbcMode = value & 0x01;
            return;
          }
        }

        default: return;
      }
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
