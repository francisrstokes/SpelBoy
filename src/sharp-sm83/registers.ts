import { negativeToU16, negativeToU8 } from "../utils";

export interface IRegisters {
  pc: number; sp: number; af: number;
  bc: number; de: number; hl: number;
  a: number; f: number; b: number; c: number;
  d: number; e: number; h: number; l: number;
};

export class Registers implements IRegisters {
  private _pc: number = 0;
  private _sp: number = 0;
  private _af: number = 0;
  private _bc: number = 0;
  private _de: number = 0;
  private _hl: number = 0;

  get pc() { return this._pc; }
  get sp() { return this._sp; }
  get af() { return this._af; }
  get bc() { return this._bc; }
  get de() { return this._de; }
  get hl() { return this._hl; }

  get a() { return this._af >> 8; };
  get f() { return this._af & 0xff; };
  get b() { return this._bc >> 8; };
  get c() { return this._bc & 0xff; };
  get d() { return this._de >> 8; };
  get e() { return this._de & 0xff; };
  get h() { return this._hl >> 8; };
  get l() { return this._hl & 0xff; };

  set pc(value: number) {
    this._pc = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }
  set sp(value: number) {
    this._sp = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }
  set af(value: number) {
    this._af = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }
  set bc(value: number) {
    this._bc = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }
  set de(value: number) {
    this._de = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }
  set hl(value: number) {
    this._hl = (value < 0) ? negativeToU16(value) : value & 0xffff;
  }

  set a(value: number) {
    this._af = ((value < 0) ? negativeToU8(value) : value & 0xff) << 8 | this._af & 0xff;
  }
  set f(value: number) {
    this._af = ((value < 0) ? negativeToU8(value) : value & 0xff) | (this._af >> 8) << 8;
  }
  set b(value: number) {
    this._bc = ((value < 0) ? negativeToU8(value) : value & 0xff) << 8 | this._bc & 0xff;
  }
  set c(value: number) {
    this._bc = ((value < 0) ? negativeToU8(value) : value & 0xff) | (this._bc >> 8) << 8;
  }
  set d(value: number) {
    this._de = ((value < 0) ? negativeToU8(value) : value & 0xff) << 8 | this._de & 0xff;
  }
  set e(value: number) {
    this._de = ((value < 0) ? negativeToU8(value) : value & 0xff) | (this._de >> 8) << 8;
  }
  set h(value: number) {
    this._hl = ((value < 0) ? negativeToU8(value) : value & 0xff) << 8 | this._hl & 0xff;
  }
  set l(value: number) {
    this._hl = ((value < 0) ? negativeToU8(value) : value & 0xff) | (this._hl >> 8) << 8;
  }
};
