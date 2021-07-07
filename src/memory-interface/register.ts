import { negativeToU8 } from './../utils';

export class Register {
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

  didOverflow() {
    return this.overflowed;
  }
};
