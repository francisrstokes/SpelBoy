import { ParsedHeader } from './../cart-parser/index';
import { MemoryBankController } from './memory-bank-controller';
import { MBCAddress } from '.';
import { IMemoryInterface } from '../memory-interface';

enum MBC1Mode {
  Default = 0x00,
  RAMBanking = 0x01,
  // TODO: Advanced ROM Banking mode (value equivilent to RAMBanking)
}

export class MBC1 extends MemoryBankController implements IMemoryInterface {
  private romBank0: Uint8Array = new Uint8Array(0x4000);
  private romBank1: Uint8Array;
  private eram: Uint8Array;

  private mbcMode: MBC1Mode = MBC1Mode.Default;

  private extraROMBits = 0;

  private hasERAM = false;
  private ERAMEnabled = false;
  private ERAMOffset = 0;

  private bank1Offset = 0x4000;

  constructor(cart: Uint8Array, header: ParsedHeader) {
    super(cart, header);

    this.romBank0 = cart.slice(0, 0x4000);
    this.romBank1 = cart.slice(0x4000);

    if (header.ram.banks > 0) {
      this.hasERAM = true;
      this.eram = new Uint8Array(0x2000 * header.ram.banks);
    }
  }

  read(address: number) {
    if (address >= MBCAddress.ROMBank0 && address < MBCAddress.ROMBank1) {
      return this.romBank0[address];
    }

    if (address >= MBCAddress.ROMBank1 && address <= MBCAddress.ROMEnd) {
      return this.romBank1[address - MBCAddress.ROMBank1 + this.bank1Offset];
    }

    if (address >= MBCAddress.ERAMStart && address <= MBCAddress.ERAMEnd) {
      if (this.hasERAM && this.ERAMEnabled) {
        return this.eram[address - MBCAddress.ERAMStart + this.ERAMOffset];
      }
    }
  }

  write(address: number, value: number) {
    if (address >= MBCAddress.ROMStart && address <= MBCAddress.ROMEnd) {
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

        const bitsRequiredForROMSelect = Math.ceil(Math.log2(this.header.rom.banks));
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

        // The bank number is offset by -1 because romBank0 is never taken into account
        this.bank1Offset = (bankNum - 1) * 0x4000;

        return;
      }

      // RAM Bank Number / Extra bits for ROM Select
      if (address < 0x6000) {
        if (this.mbcMode === MBC1Mode.Default) {
          this.extraROMBits = value & 0b11;
          return;
        }

        // Is this RAM select?
        if (this.header.ram.banks > 0) {
          const mask = (1 << Math.ceil(Math.log2(this.header.ram.banks))) - 1;
          const maskedIndex = value & mask;

          // TODO: What is the appropriate behaviour here?
          if (maskedIndex >= this.header.ram.banks) {
            throw new Error(`ERAM selection index out of bounds (${maskedIndex})`);
          }

          this.ERAMOffset = maskedIndex * 0x2000;
        }
        return;
      }

      // Banking Mode Select
      if (address < 0x8000) {
        this.mbcMode = value & 0x01;
        return;
      }
    }
  }
}
