import { KeysOfType } from './../utils';
import { SM83, Flags } from './index';
import { IRegisters } from './registers';

type RegName = KeysOfType<IRegisters, number>;

const makeRlc = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] >> 7;
  cpu.registers[reg] = (cpu.registers[reg] << 1) | carry;
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeRrc = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] & 0x01;
  cpu.registers[reg] = (carry << 7) | (cpu.registers[reg] >> 1);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeRl = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] >> 7;
  cpu.registers[reg] = (cpu.registers[reg] << 1) | ((cpu.registers.f >> Flags.CarryBit) & 1);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeRr = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] & 0x01;
  cpu.registers[reg] = ((cpu.registers.f >> Flags.CarryBit) & 1) << 7 | (cpu.registers[reg] >> 1);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeSla = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] >> 7;
  cpu.registers[reg] = (cpu.registers[reg] << 1);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeSra = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] & 0x01;
  const signMask = cpu.registers[reg] & 0x80;
  cpu.registers[reg] = signMask | (cpu.registers[reg] >> 1);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeSrl = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const carry = cpu.registers[reg] & 0x01;
  cpu.registers[reg] = cpu.registers[reg] >> 1;
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | (cpu.registers[reg] === 0 ? Flags.Zero : 0)
  );
};

const makeSwap = (reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const low = cpu.registers[reg] & 0x0f;
  const high = cpu.registers[reg] >> 4;
  cpu.registers[reg] = low << 4 | high;
  cpu.registers.f = (cpu.registers[reg] === 0 ? Flags.Zero : 0);
};

const makeBit = (i: number,  reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  const bit = (cpu.registers[reg] & (1 << i)) >> i;
  const carry = cpu.registers.f & Flags.Carry;
  cpu.registers.f = (
    ((bit === 0 ? 1 : 0) << Flags.ZeroBit)
    | Flags.HalfCarry
    | carry
  );
};

const makeBitHL = (i: number) => (cpu: SM83) => {
  cpu.clock.tick(3 * 4);
  const bit = (cpu.memory.read(cpu.registers.hl) & (1 << i)) >> i;
  const carry = cpu.registers.f & Flags.Carry;
  cpu.registers.f = (
    ((bit === 0 ? 1 : 0) << Flags.ZeroBit)
    | Flags.HalfCarry
    | carry
  );
};

const makeRes = (i: number,  reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  cpu.registers[reg] &= (~(1 << i) & 0xff);
};

const makeResHL = (i: number) => (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl) & (~(1 << i) & 0xff);
  cpu.memory.write(cpu.registers.hl, value);
};

const makeSet = (i: number,  reg: RegName) => (cpu: SM83) => {
  cpu.clock.tick(2 * 4);
  cpu.registers[reg] |= (1 << i);
};

const makeSetHL = (i: number) => (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl) | (1 << i);
  cpu.memory.write(cpu.registers.hl, value);
};

/* 0x00 */ const RLC_B = makeRlc('b');
/* 0x01 */ const RLC_C = makeRlc('c');
/* 0x02 */ const RLC_D = makeRlc('d');
/* 0x03 */ const RLC_E = makeRlc('e');
/* 0x04 */ const RLC_H = makeRlc('h');
/* 0x05 */ const RLC_L = makeRlc('l');
/* 0x06 */ const RLC_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value >> 7;
  const newValue = ((value << 1) | carry) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x07 */ const RLC_A = makeRlc('a');
/* 0x08 */ const RRC_B = makeRrc('b');
/* 0x09 */ const RRC_C = makeRrc('c');
/* 0x0A */ const RRC_D = makeRrc('d');
/* 0x0B */ const RRC_E = makeRrc('e');
/* 0x0C */ const RRC_H = makeRrc('h');
/* 0x0D */ const RRC_L = makeRrc('l');
/* 0x0E */ const RRC_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value & 0x01;
  const newValue = ((carry << 7) | (value >> 1)) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x0F */ const RRC_A = makeRrc('a');
/* 0x10 */ const RL_B = makeRl('b');
/* 0x11 */ const RL_C = makeRl('c');
/* 0x12 */ const RL_D = makeRl('d');
/* 0x13 */ const RL_E = makeRl('e');
/* 0x14 */ const RL_H = makeRl('h');
/* 0x15 */ const RL_L = makeRl('l');
/* 0x16 */ const RL_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value >> 7;
  const newValue = ((value << 1) | ((cpu.registers.f >> Flags.CarryBit) & 1)) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x17 */ const RL_A = makeRl('a');
/* 0x18 */ const RR_B = makeRr('b');
/* 0x19 */ const RR_C = makeRr('c');
/* 0x1A */ const RR_D = makeRr('d');
/* 0x1B */ const RR_E = makeRr('e');
/* 0x1C */ const RR_H = makeRr('h');
/* 0x1D */ const RR_L = makeRr('l');
/* 0x1E */ const RR_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value & 0x01;
  const newValue = ((cpu.registers.f >> Flags.CarryBit) << 7 | (value >> 1)) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x1F */ const RR_A = makeRr('a');
/* 0x20 */ const SLA_B = makeSla('b');
/* 0x21 */ const SLA_C = makeSla('c');
/* 0x22 */ const SLA_D = makeSla('d');
/* 0x23 */ const SLA_E = makeSla('e');
/* 0x24 */ const SLA_H = makeSla('h');
/* 0x25 */ const SLA_L = makeSla('l');
/* 0x26 */ const SLA_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value >> 7;
  const newValue = (value << 1) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x27 */ const SLA_A = makeSla('a');
/* 0x28 */ const SRA_B = makeSra('b');
/* 0x29 */ const SRA_C = makeSra('c');
/* 0x2A */ const SRA_D = makeSra('d');
/* 0x2B */ const SRA_E = makeSra('e');
/* 0x2C */ const SRA_H = makeSra('h');
/* 0x2D */ const SRA_L = makeSra('l');
/* 0x2E */ const SRA_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value & 0x01;
  const signMask = value & 0x80;
  const newValue = (signMask | (value >> 1)) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x2F */ const SRA_A = makeSra('a');
/* 0x30 */ const SWAP_B = makeSwap('b');
/* 0x31 */ const SWAP_C = makeSwap('c');
/* 0x32 */ const SWAP_D = makeSwap('d');
/* 0x33 */ const SWAP_E = makeSwap('e');
/* 0x34 */ const SWAP_H = makeSwap('h');
/* 0x35 */ const SWAP_L = makeSwap('l');
/* 0x36 */ const SWAP_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const low = value & 0x0f;
  const high = value >> 4;
  const newValue = low << 4 | high;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (newValue === 0 ? Flags.Zero : 0);
};
/* 0x37 */ const SWAP_A = makeSwap('a');
/* 0x38 */ const SRL_B = makeSrl('b');
/* 0x39 */ const SRL_C = makeSrl('c');
/* 0x3A */ const SRL_D = makeSrl('d');
/* 0x3B */ const SRL_E = makeSrl('e');
/* 0x3C */ const SRL_H = makeSrl('h');
/* 0x3D */ const SRL_L = makeSrl('l');
/* 0x3E */ const SRL_mHL = (cpu: SM83) => {
  cpu.clock.tick(4 * 4);
  const value = cpu.memory.read(cpu.registers.hl);
  const carry = value & 0x01;
  const newValue = (value >> 1) & 0xff;
  cpu.memory.write(cpu.registers.hl, newValue);
  cpu.registers.f = (
    (carry ? Flags.Carry : 0)
    | ((newValue & 0xff) === 0 ? Flags.Zero : 0)
  );
};
/* 0x3F */ const SRL_A = makeSrl('a');

/* 0x40 */ const BIT_0_B = makeBit(0, 'b');
/* 0x41 */ const BIT_0_C = makeBit(0, 'c');
/* 0x42 */ const BIT_0_D = makeBit(0, 'd');
/* 0x43 */ const BIT_0_E = makeBit(0, 'e');
/* 0x44 */ const BIT_0_H = makeBit(0, 'h');
/* 0x45 */ const BIT_0_L = makeBit(0, 'l');
/* 0x46 */ const BIT_0_mHL = makeBitHL(0);
/* 0x47 */ const BIT_0_A = makeBit(0, 'a');
/* 0x48 */ const BIT_1_B = makeBit(1, 'b');
/* 0x49 */ const BIT_1_C = makeBit(1, 'c');
/* 0x4A */ const BIT_1_D = makeBit(1, 'd');
/* 0x4B */ const BIT_1_E = makeBit(1, 'e');
/* 0x4C */ const BIT_1_H = makeBit(1, 'h');
/* 0x4D */ const BIT_1_L = makeBit(1, 'l');
/* 0x4E */ const BIT_1_mHL = makeBitHL(1);
/* 0x4F */ const BIT_1_A = makeBit(1, 'a');
/* 0x50 */ const BIT_2_B = makeBit(2, 'b');
/* 0x51 */ const BIT_2_C = makeBit(2, 'c');
/* 0x52 */ const BIT_2_D = makeBit(2, 'd');
/* 0x53 */ const BIT_2_E = makeBit(2, 'e');
/* 0x54 */ const BIT_2_H = makeBit(2, 'h');
/* 0x55 */ const BIT_2_L = makeBit(2, 'l');
/* 0x56 */ const BIT_2_mHL = makeBitHL(2);
/* 0x57 */ const BIT_2_A = makeBit(2, 'a');
/* 0x58 */ const BIT_3_B = makeBit(3, 'b');
/* 0x59 */ const BIT_3_C = makeBit(3, 'c');
/* 0x5A */ const BIT_3_D = makeBit(3, 'd');
/* 0x5B */ const BIT_3_E = makeBit(3, 'e');
/* 0x5C */ const BIT_3_H = makeBit(3, 'h');
/* 0x5D */ const BIT_3_L = makeBit(3, 'l');
/* 0x5E */ const BIT_3_mHL = makeBitHL(3);
/* 0x5F */ const BIT_3_A = makeBit(3, 'a');
/* 0x60 */ const BIT_4_B = makeBit(4, 'b');
/* 0x61 */ const BIT_4_C = makeBit(4, 'c');
/* 0x62 */ const BIT_4_D = makeBit(4, 'd');
/* 0x63 */ const BIT_4_E = makeBit(4, 'e');
/* 0x64 */ const BIT_4_H = makeBit(4, 'h');
/* 0x65 */ const BIT_4_L = makeBit(4, 'l');
/* 0x66 */ const BIT_4_mHL = makeBitHL(4);
/* 0x67 */ const BIT_4_A = makeBit(4, 'a');
/* 0x68 */ const BIT_5_B = makeBit(5, 'b');
/* 0x69 */ const BIT_5_C = makeBit(5, 'c');
/* 0x6A */ const BIT_5_D = makeBit(5, 'd');
/* 0x6B */ const BIT_5_E = makeBit(5, 'e');
/* 0x6C */ const BIT_5_H = makeBit(5, 'h');
/* 0x6D */ const BIT_5_L = makeBit(5, 'l');
/* 0x6E */ const BIT_5_mHL = makeBitHL(5);
/* 0x6F */ const BIT_5_A = makeBit(5, 'a');
/* 0x70 */ const BIT_6_B = makeBit(6, 'b');
/* 0x71 */ const BIT_6_C = makeBit(6, 'c');
/* 0x72 */ const BIT_6_D = makeBit(6, 'd');
/* 0x73 */ const BIT_6_E = makeBit(6, 'e');
/* 0x74 */ const BIT_6_H = makeBit(6, 'h');
/* 0x75 */ const BIT_6_L = makeBit(6, 'l');
/* 0x76 */ const BIT_6_mHL = makeBitHL(6);
/* 0x77 */ const BIT_6_A = makeBit(6, 'a');
/* 0x78 */ const BIT_7_B = makeBit(7, 'b');
/* 0x79 */ const BIT_7_C = makeBit(7, 'c');
/* 0x7A */ const BIT_7_D = makeBit(7, 'd');
/* 0x7B */ const BIT_7_E = makeBit(7, 'e');
/* 0x7C */ const BIT_7_H = makeBit(7, 'h');
/* 0x7D */ const BIT_7_L = makeBit(7, 'l');
/* 0x7E */ const BIT_7_mHL = makeBitHL(7);
/* 0x7F */ const BIT_7_A = makeBit(7, 'a');
/* 0x80 */ const RES_0_B = makeRes(0, 'b');
/* 0x81 */ const RES_0_C = makeRes(0, 'c');
/* 0x82 */ const RES_0_D = makeRes(0, 'd');
/* 0x83 */ const RES_0_E = makeRes(0, 'e');
/* 0x84 */ const RES_0_H = makeRes(0, 'h');
/* 0x85 */ const RES_0_L = makeRes(0, 'l');
/* 0x86 */ const RES_0_mHL = makeResHL(0);
/* 0x87 */ const RES_0_A = makeRes(0, 'a');
/* 0x88 */ const RES_1_B = makeRes(1, 'b');
/* 0x89 */ const RES_1_C = makeRes(1, 'c');
/* 0x8A */ const RES_1_D = makeRes(1, 'd');
/* 0x8B */ const RES_1_E = makeRes(1, 'e');
/* 0x8C */ const RES_1_H = makeRes(1, 'h');
/* 0x8D */ const RES_1_L = makeRes(1, 'l');
/* 0x8E */ const RES_1_mHL = makeResHL(1);
/* 0x8F */ const RES_1_A = makeRes(1, 'a');
/* 0x90 */ const RES_2_B = makeRes(2, 'b');
/* 0x91 */ const RES_2_C = makeRes(2, 'c');
/* 0x92 */ const RES_2_D = makeRes(2, 'd');
/* 0x93 */ const RES_2_E = makeRes(2, 'e');
/* 0x94 */ const RES_2_H = makeRes(2, 'h');
/* 0x95 */ const RES_2_L = makeRes(2, 'l');
/* 0x96 */ const RES_2_mHL = makeResHL(2);
/* 0x97 */ const RES_2_A = makeRes(2, 'a');
/* 0x98 */ const RES_3_B = makeRes(3, 'b');
/* 0x99 */ const RES_3_C = makeRes(3, 'c');
/* 0x9A */ const RES_3_D = makeRes(3, 'd');
/* 0x9B */ const RES_3_E = makeRes(3, 'e');
/* 0x9C */ const RES_3_H = makeRes(3, 'h');
/* 0x9D */ const RES_3_L = makeRes(3, 'l');
/* 0x9E */ const RES_3_mHL = makeResHL(3);
/* 0x9F */ const RES_3_A = makeRes(3, 'a');
/* 0xA0 */ const RES_4_B = makeRes(4, 'b');
/* 0xA1 */ const RES_4_C = makeRes(4, 'c');
/* 0xA2 */ const RES_4_D = makeRes(4, 'd');
/* 0xA3 */ const RES_4_E = makeRes(4, 'e');
/* 0xA4 */ const RES_4_H = makeRes(4, 'h');
/* 0xA5 */ const RES_4_L = makeRes(4, 'l');
/* 0xA6 */ const RES_4_mHL = makeResHL(4);
/* 0xA7 */ const RES_4_A = makeRes(4, 'a');
/* 0xA8 */ const RES_5_B = makeRes(5, 'b');
/* 0xA9 */ const RES_5_C = makeRes(5, 'c');
/* 0xAA */ const RES_5_D = makeRes(5, 'd');
/* 0xAB */ const RES_5_E = makeRes(5, 'e');
/* 0xAC */ const RES_5_H = makeRes(5, 'h');
/* 0xAD */ const RES_5_L = makeRes(5, 'l');
/* 0xAE */ const RES_5_mHL = makeResHL(5);
/* 0xAF */ const RES_5_A = makeRes(5, 'a');
/* 0xB0 */ const RES_6_B = makeRes(6, 'b');
/* 0xB1 */ const RES_6_C = makeRes(6, 'c');
/* 0xB2 */ const RES_6_D = makeRes(6, 'd');
/* 0xB3 */ const RES_6_E = makeRes(6, 'e');
/* 0xB4 */ const RES_6_H = makeRes(6, 'h');
/* 0xB5 */ const RES_6_L = makeRes(6, 'l');
/* 0xB6 */ const RES_6_mHL = makeResHL(6);
/* 0xB7 */ const RES_6_A = makeRes(6, 'a');
/* 0xB8 */ const RES_7_B = makeRes(7, 'b');
/* 0xB9 */ const RES_7_C = makeRes(7, 'c');
/* 0xBA */ const RES_7_D = makeRes(7, 'd');
/* 0xBB */ const RES_7_E = makeRes(7, 'e');
/* 0xBC */ const RES_7_H = makeRes(7, 'h');
/* 0xBD */ const RES_7_L = makeRes(7, 'l');
/* 0xBE */ const RES_7_mHL = makeResHL(7);
/* 0xBF */ const RES_7_A = makeRes(7, 'a');
/* 0xC0 */ const SET_0_B = makeSet(0, 'b');
/* 0xC1 */ const SET_0_C = makeSet(0, 'c');
/* 0xC2 */ const SET_0_D = makeSet(0, 'd');
/* 0xC3 */ const SET_0_E = makeSet(0, 'e');
/* 0xC4 */ const SET_0_H = makeSet(0, 'h');
/* 0xC5 */ const SET_0_L = makeSet(0, 'l');
/* 0xC6 */ const SET_0_mHL = makeSetHL(0);
/* 0xC7 */ const SET_0_A = makeSet(0, 'a');
/* 0xC8 */ const SET_1_B = makeSet(1, 'b');
/* 0xC9 */ const SET_1_C = makeSet(1, 'c');
/* 0xCA */ const SET_1_D = makeSet(1, 'd');
/* 0xCB */ const SET_1_E = makeSet(1, 'e');
/* 0xCC */ const SET_1_H = makeSet(1, 'h');
/* 0xCD */ const SET_1_L = makeSet(1, 'l');
/* 0xCE */ const SET_1_mHL = makeSetHL(1);
/* 0xCF */ const SET_1_A = makeSet(1, 'a');
/* 0xD0 */ const SET_2_B = makeSet(2, 'b');
/* 0xD1 */ const SET_2_C = makeSet(2, 'c');
/* 0xD2 */ const SET_2_D = makeSet(2, 'd');
/* 0xD3 */ const SET_2_E = makeSet(2, 'e');
/* 0xD4 */ const SET_2_H = makeSet(2, 'h');
/* 0xD5 */ const SET_2_L = makeSet(2, 'l');
/* 0xD6 */ const SET_2_mHL = makeSetHL(2);
/* 0xD7 */ const SET_2_A = makeSet(2, 'a');
/* 0xD8 */ const SET_3_B = makeSet(3, 'b');
/* 0xD9 */ const SET_3_C = makeSet(3, 'c');
/* 0xDA */ const SET_3_D = makeSet(3, 'd');
/* 0xDB */ const SET_3_E = makeSet(3, 'e');
/* 0xDC */ const SET_3_H = makeSet(3, 'h');
/* 0xDD */ const SET_3_L = makeSet(3, 'l');
/* 0xDE */ const SET_3_mHL = makeSetHL(3);
/* 0xDF */ const SET_3_A = makeSet(3, 'a');
/* 0xE0 */ const SET_4_B = makeSet(4, 'b');
/* 0xE1 */ const SET_4_C = makeSet(4, 'c');
/* 0xE2 */ const SET_4_D = makeSet(4, 'd');
/* 0xE3 */ const SET_4_E = makeSet(4, 'e');
/* 0xE4 */ const SET_4_H = makeSet(4, 'h');
/* 0xE5 */ const SET_4_L = makeSet(4, 'l');
/* 0xE6 */ const SET_4_mHL = makeSetHL(4);
/* 0xE7 */ const SET_4_A = makeSet(4, 'a');
/* 0xE8 */ const SET_5_B = makeSet(5, 'b');
/* 0xE9 */ const SET_5_C = makeSet(5, 'c');
/* 0xEA */ const SET_5_D = makeSet(5, 'd');
/* 0xEB */ const SET_5_E = makeSet(5, 'e');
/* 0xEC */ const SET_5_H = makeSet(5, 'h');
/* 0xED */ const SET_5_L = makeSet(5, 'l');
/* 0xEE */ const SET_5_mHL = makeSetHL(5);
/* 0xEF */ const SET_5_A = makeSet(5, 'a');
/* 0xF0 */ const SET_6_B = makeSet(6, 'b');
/* 0xF1 */ const SET_6_C = makeSet(6, 'c');
/* 0xF2 */ const SET_6_D = makeSet(6, 'd');
/* 0xF3 */ const SET_6_E = makeSet(6, 'e');
/* 0xF4 */ const SET_6_H = makeSet(6, 'h');
/* 0xF5 */ const SET_6_L = makeSet(6, 'l');
/* 0xF6 */ const SET_6_mHL = makeSetHL(6);
/* 0xF7 */ const SET_6_A = makeSet(6, 'a');
/* 0xF8 */ const SET_7_B = makeSet(7, 'b');
/* 0xF9 */ const SET_7_C = makeSet(7, 'c');
/* 0xFA */ const SET_7_D = makeSet(7, 'd');
/* 0xFB */ const SET_7_E = makeSet(7, 'e');
/* 0xFC */ const SET_7_H = makeSet(7, 'h');
/* 0xFD */ const SET_7_L = makeSet(7, 'l');
/* 0xFE */ const SET_7_mHL = makeSetHL(7);
/* 0xFF */ const SET_7_A = makeSet(7, 'a');

export const cbOps: Array<(cpu: SM83) => void> = [
  /* 00 */ RLC_B, RLC_C, RLC_D, RLC_E, RLC_H, RLC_L, RLC_mHL, RLC_A,
  /* 08 */ RRC_B, RRC_C, RRC_D, RRC_E, RRC_H, RRC_L, RRC_mHL, RRC_A,
  /* 10 */ RL_B, RL_C, RL_D, RL_E, RL_H, RL_L, RL_mHL, RL_A,
  /* 18 */ RR_B, RR_C, RR_D, RR_E, RR_H, RR_L, RR_mHL, RR_A,
  /* 20 */ SLA_B, SLA_C, SLA_D, SLA_E, SLA_H, SLA_L, SLA_mHL, SLA_A,
  /* 28 */ SRA_B, SRA_C, SRA_D, SRA_E, SRA_H, SRA_L, SRA_mHL, SRA_A,
  /* 30 */ SWAP_B, SWAP_C, SWAP_D, SWAP_E, SWAP_H, SWAP_L, SWAP_mHL, SWAP_A,
  /* 38 */ SRL_B, SRL_C, SRL_D, SRL_E, SRL_H, SRL_L, SRL_mHL, SRL_A,
  /* 40 */ BIT_0_B, BIT_0_C, BIT_0_D, BIT_0_E, BIT_0_H, BIT_0_L, BIT_0_mHL, BIT_0_A,
  /* 48 */ BIT_1_B, BIT_1_C, BIT_1_D, BIT_1_E, BIT_1_H, BIT_1_L, BIT_1_mHL, BIT_1_A,
  /* 50 */ BIT_2_B, BIT_2_C, BIT_2_D, BIT_2_E, BIT_2_H, BIT_2_L, BIT_2_mHL, BIT_2_A,
  /* 58 */ BIT_3_B, BIT_3_C, BIT_3_D, BIT_3_E, BIT_3_H, BIT_3_L, BIT_3_mHL, BIT_3_A,
  /* 60 */ BIT_4_B, BIT_4_C, BIT_4_D, BIT_4_E, BIT_4_H, BIT_4_L, BIT_4_mHL, BIT_4_A,
  /* 68 */ BIT_5_B, BIT_5_C, BIT_5_D, BIT_5_E, BIT_5_H, BIT_5_L, BIT_5_mHL, BIT_5_A,
  /* 70 */ BIT_6_B, BIT_6_C, BIT_6_D, BIT_6_E, BIT_6_H, BIT_6_L, BIT_6_mHL, BIT_6_A,
  /* 78 */ BIT_7_B, BIT_7_C, BIT_7_D, BIT_7_E, BIT_7_H, BIT_7_L, BIT_7_mHL, BIT_7_A,
  /* 80 */ RES_0_B, RES_0_C, RES_0_D, RES_0_E, RES_0_H, RES_0_L, RES_0_mHL, RES_0_A,
  /* 88 */ RES_1_B, RES_1_C, RES_1_D, RES_1_E, RES_1_H, RES_1_L, RES_1_mHL, RES_1_A,
  /* 90 */ RES_2_B, RES_2_C, RES_2_D, RES_2_E, RES_2_H, RES_2_L, RES_2_mHL, RES_2_A,
  /* 98 */ RES_3_B, RES_3_C, RES_3_D, RES_3_E, RES_3_H, RES_3_L, RES_3_mHL, RES_3_A,
  /* A0 */ RES_4_B, RES_4_C, RES_4_D, RES_4_E, RES_4_H, RES_4_L, RES_4_mHL, RES_4_A,
  /* A8 */ RES_5_B, RES_5_C, RES_5_D, RES_5_E, RES_5_H, RES_5_L, RES_5_mHL, RES_5_A,
  /* B0 */ RES_6_B, RES_6_C, RES_6_D, RES_6_E, RES_6_H, RES_6_L, RES_6_mHL, RES_6_A,
  /* B8 */ RES_7_B, RES_7_C, RES_7_D, RES_7_E, RES_7_H, RES_7_L, RES_7_mHL, RES_7_A,
  /* C0 */ SET_0_B, SET_0_C, SET_0_D, SET_0_E, SET_0_H, SET_0_L, SET_0_mHL, SET_0_A,
  /* C8 */ SET_1_B, SET_1_C, SET_1_D, SET_1_E, SET_1_H, SET_1_L, SET_1_mHL, SET_1_A,
  /* D0 */ SET_2_B, SET_2_C, SET_2_D, SET_2_E, SET_2_H, SET_2_L, SET_2_mHL, SET_2_A,
  /* D8 */ SET_3_B, SET_3_C, SET_3_D, SET_3_E, SET_3_H, SET_3_L, SET_3_mHL, SET_3_A,
  /* E0 */ SET_4_B, SET_4_C, SET_4_D, SET_4_E, SET_4_H, SET_4_L, SET_4_mHL, SET_4_A,
  /* E8 */ SET_5_B, SET_5_C, SET_5_D, SET_5_E, SET_5_H, SET_5_L, SET_5_mHL, SET_5_A,
  /* F0 */ SET_6_B, SET_6_C, SET_6_D, SET_6_E, SET_6_H, SET_6_L, SET_6_mHL, SET_6_A,
  /* F8 */ SET_7_B, SET_7_C, SET_7_D, SET_7_E, SET_7_H, SET_7_L, SET_7_mHL, SET_7_A,
];
