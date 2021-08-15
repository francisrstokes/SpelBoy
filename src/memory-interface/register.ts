import { negativeToU16, negativeToU8 } from './../utils';

export interface Register {
  value: number;
  bit: (index: number) => number;
  clearBit: (index: number) => void;
  setBit: (index: number) => void;
  didOverflow: () => boolean;
  clearOverflow: () => void;
  onWrite: (cb: ((value: number) => void)) => void;
}

abstract class BaseRegister {
  _value: number;
  _overflowed: boolean = false;
  _onWriteCallback: (value: number) => void = null;

  constructor(initialValue: number = 0) {
    this._value = initialValue;
  }

  abstract get value();
  abstract set value(v:  number);

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
    return this._overflowed;
  }

  clearOverflow() {
    this._overflowed = false;
  }

  onWrite(cb: (value: number) => void)  {
    this._onWriteCallback = cb;
  }
}

export class Register8 extends BaseRegister implements Register {
  get value() { return this._value; }
  set value(v: number) {
    this._overflowed = (v > 0xff || v < -128);
    this._value = ((v < 0) ? negativeToU8(v) : v) & 0xff;
    if (this._onWriteCallback) this._onWriteCallback(this._value);
  }
};

export class Register16 extends BaseRegister implements Register {
  get value() { return this._value; }
  set value(v: number) {
    this._overflowed = (v > 0xffff || v < -32768);
    this._value = ((v < 0) ? negativeToU16(v) : v) & 0xffff;
  }

};
