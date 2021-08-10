import { ParsedHeader } from "../cart-parser";
import { CartridgeType } from "../cart-parser/tables";
import { MBC1 } from "./mbc1";
import { ROMOnly } from "./rom-only";

export enum MBCAddress {
  ROMStart = 0x0000,
  ROMBank0 = 0x0000,
  ROMBank1 = 0x4000,
  ROMEnd = 0x7FFF,
  ERAMStart = 0xA000,
  ERAMEnd = 0xBFFF,
}

type MBCFactory = (cart: Uint8Array, header: ParsedHeader) => ROMOnly | MBC1;

export const MBCs: Record<number, MBCFactory> = {
  [CartridgeType.ROM_ONLY]: (cart: Uint8Array, header: ParsedHeader) => new ROMOnly(cart, header),
  [CartridgeType.MBC1]: (cart: Uint8Array, header: ParsedHeader) => new MBC1(cart, header),
  [CartridgeType.MBC1_RAM]: (cart: Uint8Array, header: ParsedHeader) => new MBC1(cart, header),
  [CartridgeType.MBC1_RAM_BATTERY]: (cart: Uint8Array, header: ParsedHeader) => new MBC1(cart, header),
};
