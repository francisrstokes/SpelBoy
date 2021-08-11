import { ParsedHeader } from '../cart-parser/index';
import { MemoryBankController } from './memory-bank-controller';
import { IMemoryInterface } from '../memory-interface/index';
import { MBCAddress } from '.';

export class ROMOnly extends MemoryBankController implements IMemoryInterface {
  private romBank0: Uint8Array = new Uint8Array(0x4000);
  private romBank1: Uint8Array = new Uint8Array(0x4000);

  constructor(cart: Uint8Array, header: ParsedHeader) {
    super(cart, header);
    this.loadROMBank0(cart.slice(0, 0x4000));
    this.loadROMBank1(cart.slice(0x4000, 0x8000));
  }

  read(address: number) {
    if (address >= MBCAddress.ROMBank0 && address < MBCAddress.ROMBank1) {
      return this.romBank0[address];
    }

    if (address >= MBCAddress.ROMBank1 && address <= MBCAddress.ROMEnd) {
      return this.romBank1[address - 0x4000];
    }

    if (address >= MBCAddress.ERAMStart && address <= MBCAddress.ERAMEnd) {
      return 0xff;
    }
  }

  write(address: number, value: number) {}

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
}
