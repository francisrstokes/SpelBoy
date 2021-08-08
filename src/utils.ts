export const negativeToU8 = (value: number) => (~Math.abs(value) & 0xff) + 1;
export const negativeToU16 = (value: number) => (~Math.abs(value) & 0xffff) + 1;

export const i8ToNegative = (value: number) => -negativeToU8(value);
export const i16ToNegative = (value: number) => -negativeToU16(value);

export const asI8 = (value: number) => {
  const v8 = value & 0xff;
  return (v8 & 0x80) ? i8ToNegative(v8) : v8;
};

export const toHexString = (value: number, padTo: number = 4) => value.toString(16).padStart(padTo, '0');
export const toBinString = (value: number, padTo: number = 8) => value.toString(2).padStart(padTo, '0');

export type KeysOfType<T, KT> = { [P in keyof T]: T[P] extends KT ? P : never }[keyof T];
export type ArrayPair<A, B> = [A, B];
