import { ParsedHeader } from "../cart-parser";
import { IMemoryInterface } from "../memory-interface";

export abstract class MemoryBankController implements IMemoryInterface {
  cart: Uint8Array;
  header: ParsedHeader;

  constructor(cart: Uint8Array, header: ParsedHeader) {
    this.cart = cart;
    this.header = header;
  }

  abstract read(address: number): number;
  abstract write(address: number, value: number): void;
}
