import {
  cartridgeTypeTable,
  newLicenseeCodeTable,
  oldLicenseeCodeTable,
  ramSizeTable,
  ROMSizeDescriptor,
  romSizeTable
} from "./tables";

export type ParsedHeader = {
  title: string;
  manufacturerCode: string;
  newLicensee: {
    byte: number;
    name: string;
  };
  cgb: number;
  sgb: number;
  cartridgeType: {
    byte: number;
    description: string;
  };
  rom: ROMSizeDescriptor & { byte: number };
  ram: {
    banks: number;
    byte: number;
    size: number;
    description: string;
  };
  destination: string;
  oldLicensee: {
    byte: number;
    name: string;
  };
  maskROMNumber: number;
  headerChecksum: {
    value: number;
    passed: boolean;
  };
  globalChecksum: {
    value: number;
    passed: boolean;
  };
};

enum CartAddress {
  HeaderChecksumStartAddress = 0x0134,

  Title             = 0x0134,
  ManufacturerCode  = 0x013F,
  CGB               = 0x0143,
  NewLicenseeCode   = 0x0144,
  SGB               = 0x0146,
  CartridgeType     = 0x0147,
  ROMSize           = 0x0148,
  RAMSize           = 0x0149,
  DestinationCode   = 0x014A,
  OldLicenseeCode   = 0x014B,
  MaskROMNumber     = 0x014C,

  HeaderChecksumEndAddress = 0x014C,

  HeaderChecksum    = 0x014D,
  GlobalChecksum    = 0x014E
};

const parseTitle = (cart: Uint8Array) => {
  let title = '';
  for (let i = 0; i < 16; i++) {
    const char = cart[CartAddress.Title + i];
    if (char === 0x00) break;
    title += String.fromCharCode(char);
  }
  return title;
};

const parseManufacturerCode = (cart: Uint8Array) => {
  const codeBytes = cart.slice(CartAddress.ManufacturerCode, CartAddress.ManufacturerCode + 4);
  const code = [...codeBytes].map(b => String.fromCharCode(b)).join('');
  return code;
};

const parseNewLicensee = (cart: Uint8Array) => {
  const byte = cart[CartAddress.NewLicenseeCode];
  const name = newLicenseeCodeTable[byte] || '';
  return { byte, name };
};

const parseNewCartridgeType = (cart: Uint8Array) => {
  const byte = cart[CartAddress.CartridgeType];
  const description = cartridgeTypeTable[byte] || '';
  return { byte, description };
};

const parseROMSize = (cart: Uint8Array) => {
  const byte = cart[CartAddress.ROMSize];
  const descriptor = romSizeTable[byte] || { size: -1, banks: -1 };
  return {
    byte,
    ...descriptor
  };
};

const parseRAMSize = (cart: Uint8Array) => {
  const byte = cart[CartAddress.RAMSize];
  const descriptor = ramSizeTable[byte] || { banks: 0, size: -1, description: 'Unknown RAM Type' };
  return {
    byte,
    ...descriptor
  };
};

const parseOldLicensee = (cart: Uint8Array) => {
  const byte = cart[CartAddress.OldLicenseeCode];
  const name = oldLicenseeCodeTable[byte] || '';
  return { byte, name };
};

const parseHeaderChecksum = (cart: Uint8Array) => {
  const value = cart[CartAddress.HeaderChecksum];

  let x = 0;
  for (let i = CartAddress.HeaderChecksumStartAddress; i <= CartAddress.HeaderChecksumEndAddress; i++) {
    x = (x - cart[i] - 1) & 0xff;
  }

  return { value, passed: x === value };
};

const parseGlobalChecksum = (cart: Uint8Array) => {
  // Big endian value for some reason 🤔
  const value = (cart[CartAddress.GlobalChecksum] << 8) | (cart[CartAddress.GlobalChecksum + 1]);

  let x = 0;
  for (let i = 0; i < cart.length; i++) {
    if (i !== CartAddress.GlobalChecksum && i !== CartAddress.GlobalChecksum + 1) {
      x = (x + cart[i]) & 0xffff;
    }
  }

  return { value, passed: x === value };
};

export const parseCart = (cart: Uint8Array): ParsedHeader => ({
  title: parseTitle(cart),
  manufacturerCode: parseManufacturerCode(cart),
  cgb: cart[CartAddress.CGB],
  sgb: cart[CartAddress.SGB],
  newLicensee: parseNewLicensee(cart),
  cartridgeType: parseNewCartridgeType(cart),
  rom: parseROMSize(cart),
  ram: parseRAMSize(cart),
  destination: cart[CartAddress.DestinationCode] === 0x00 ? 'Japanese' : 'Non-Japanese',
  oldLicensee: parseOldLicensee(cart),
  maskROMNumber: cart[CartAddress.MaskROMNumber],
  headerChecksum: parseHeaderChecksum(cart),
  globalChecksum: parseGlobalChecksum(cart),
});
