export const negativeToU8 = (value: number) => (~Math.abs(value) & 0xff) + 1;
export const negativeToU16 = (value: number) => (~Math.abs(value) & 0xffff) + 1;

export const toHexString = (value: number, padTo: number = 4) => value.toString(16).padStart(padTo, '0');

export type KeysOfType<T, KT> = { [P in keyof T]: T[P] extends KT ? P : never }[keyof T];
export type ArrayPair<A, B> = [A, B];
