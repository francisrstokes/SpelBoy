import { negativeToU16, negativeToU8 } from "../utils";

export interface IRegisters {
  pc: number; sp: number; af: number;
  bc: number; de: number; hl: number;
  a: number; f: number; b: number; c: number;
  d: number; e: number; h: number; l: number;

  fullCarry: boolean;
  halfCarry: boolean;

  getDestByIndex8: (index: number) => number;
  getDestByIndex16: (index: number) => number;
  getSourceByIndex8: (index: number) => number;
  getSourceByIndex16: (index: number) => number;
  setDestByIndex8: (value: number, index: number) => void;
  setSourceByIndex8: (value: number, index: number) => void;
  setDestByIndex16: (value: number, index: number) => void;
  setSourceByIndex16: (value: number, index: number) => void;
};

export class Registers implements IRegisters {
  private _pc: number = 0;
  private _sp: number = 0;
  private _af: number = 0;
  private _bc: number = 0;
  private _de: number = 0;
  private _hl: number = 0;

  fullCarry = false;
  halfCarry = false;

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

  getDestByIndex8(index: number) {
    switch (index) {
      case 0b111: return this.a;
      case 0b000: return this.b;
      case 0b001: return this.c;
      case 0b101: return this.d;
    }

    throw new Error(`8-bit destination register index ${index} out of range`);
  }

  getSourceByIndex8(index: number) {
    switch (index) {
      case 0b011: return this.e;
      case 0b100: return this.h;
      case 0b101: return this.l;
    }

    throw new Error(`8-bit source register index ${index} out of range`);
  }

  getDestByIndex16(index: number) {
    switch (index) {
      case 0b00: return this.af;
      case 0b01: return this.bc;
      case 0b10: return this.de;
      case 0b11: return this.hl;
    }

    throw new Error(`16-bit Register index ${index} out of range (0-3)`);
  }

  getSourceByIndex16(index: number) {
    switch (index) {
      case 0b00: return this.af;
      case 0b01: return this.bc;
      case 0b10: return this.de;
      case 0b11: return this.hl;
    }

    throw new Error(`16-bit Register index ${index} out of range (0-3)`);
  }

  setDestByIndex8(value: number, index: number) {
    switch (index) {
      case 0b111: this.a = value; return;
      case 0b000: this.b = value; return;
      case 0b001: this.c = value; return;
      case 0b101: this.d = value; return;
    }

    throw new Error(`8-bit Register index ${index} out of range (0-6)`);
  }

  setSourceByIndex8(value: number, index: number) {
    switch (index) {
      case 0b011: this.e = value; return;
      case 0b100: this.h = value; return;
      case 0b101: this.l = value; return;
    }

    throw new Error(`8-bit source register index ${index} out of range`);
  }

  setDestByIndex16(value: number, index: number) {
    switch (index) {
      case 0b00: this.af = value; return;
      case 0b01: this.bc = value; return;
      case 0b10: this.de = value; return;
      case 0b11: this.hl = value; return;
    }

    throw new Error(`16-bit Register index ${index} out of range (0-3)`);
  }

  setSourceByIndex16(value: number, index: number) {
    switch (index) {
      case 0b00: this.af = value; return;
      case 0b01: this.bc = value; return;
      case 0b10: this.de = value; return;
      case 0b11: this.hl = value; return;
    }

    throw new Error(`16-bit Register index ${index} out of range (0-3)`);
  }
};
