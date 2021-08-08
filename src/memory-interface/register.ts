import { negativeToU16, negativeToU8 } from './../utils';

export interface Register {
  value: number;
  bit: (index: number) => number;
  clearBit: (index: number) => void;
  setBit: (index: number) => void;
  didOverflow: () => boolean;
  clearOverflow: () => void;
}

export class Register8 implements Register {
  private _value: number;
  private overflowed: boolean = false;

  constructor(initialValue: number = 0) {
    this._value = initialValue;
  }

  get value() { return this._value; }
  set value(v: number) {
    this.overflowed = (v > 0xff || v < -128);
    this._value = ((v < 0) ? negativeToU8(v) : v) & 0xff;
  }

  bit(index: number) {
    return (this._value >> index) & 1;
  }

  setBit(index: number) {
    this._value |= (1 << index);
  }

  clearBit(index: number) {
    this._value &= ~(1 << index);
  }

  didOverflow() {
    return this.overflowed;
  }

  clearOverflow() {
    this.overflowed = false;
  }
};

export class Register16 implements Register {
  private _value: number;
  private overflowed: boolean = false;

  constructor(initialValue: number = 0) {
    this._value = initialValue;
  }

  get value() { return this._value; }
  set value(v: number) {
    this.overflowed = (v > 0xffff || v < -32768);
    this._value = ((v < 0) ? negativeToU16(v) : v) & 0xffff;
  }

  bit(index: number) {
    return (this._value >> index) & 1;
  }

  setBit(index: number) {
    this._value |= (1 << index);
  }

  clearBit(index: number) {
    this._value &= ~(1 << index);
  }

  didOverflow() {
    return this.overflowed;
  }

  clearOverflow() {
    this.overflowed = false;
  }
};
