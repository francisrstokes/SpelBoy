import { KeysOfType } from './../utils';
import { SM83, Flags } from './index';
import { IRegisters } from './registers';
import { cbOps } from './cb';

type RegName = KeysOfType<IRegisters, number>;

/* 0x00 */ const NOP = (cpu: SM83) => {
  cpu.cycles += 4;
};
/* 0x01 */ const LD_BC_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.bc = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0x02 */ const LD_mBC_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.bc, cpu.registers.a);
};
/* 0x03 */ const INC_BC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.bc++;
};
/* 0x04 */ const INC_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b++;
  cpu.registers.f = (
    (cpu.registers.b === 0 ? Flags.Zero : 0)
    | ((cpu.registers.b & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x05 */ const DEC_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b--;
  cpu.registers.f = (
    (cpu.registers.b === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.b & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x06 */ const LD_B_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.b = cpu.memory.read(cpu.registers.pc++);
};
/* 0x07 */ const RLCA = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const carry = cpu.registers.a >> 7;
  cpu.registers.a = (cpu.registers.a << 1) | carry;
  cpu.registers.f = carry ? Flags.Carry : 0;
};
/* 0x08 */ const LD_mnn_SP = (cpu: SM83) => {
  cpu.cycles += (5 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  cpu.memory.write(addr, cpu.registers.sp & 0xff);
  cpu.memory.write(addr + 1, cpu.registers.sp >> 8);
};
/* 0x09 */ const ADD_HL_BC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.hl + cpu.registers.bc;
  cpu.registers.hl = result;
  cpu.registers.f = (
    (cpu.registers.f & Flags.Zero)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xffff ? Flags.Carry : 0)
  );
};
/* 0x0A */ const LD_A_mBC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.bc);
};
/* 0x0B */ const DEC_BC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.bc--;
};
/* 0x0C */ const INC_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c++;
  cpu.registers.f = (
    (cpu.registers.c === 0 ? Flags.Zero : 0)
    | ((cpu.registers.c & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x0D */ const DEC_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c--;
  cpu.registers.f = (
    (cpu.registers.c === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.c & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x0E */ const LD_C_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.c = cpu.memory.read(cpu.registers.pc++);
};
/* 0x0F */ const RRCA = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const borrow = cpu.registers.a & 0x01;
  cpu.registers.a = (borrow << 7) | (cpu.registers.a >> 1);
  cpu.registers.f = borrow ? Flags.Carry : 0;
};
/* 0x10 */ const STOP = (cpu: SM83) => {
  cpu.isStopped = true;
  cpu.cycles += (1 * 4);
};
/* 0x11 */ const LD_DE_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.de = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0x12 */ const LD_mDE_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.de, cpu.registers.a);
};
/* 0x13 */ const INC_DE = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.de++;
};
/* 0x14 */ const INC_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d++;
  cpu.registers.f = (
    (cpu.registers.d === 0 ? Flags.Zero : 0)
    | ((cpu.registers.d & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x15 */ const DEC_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d--;
  cpu.registers.f = (
    (cpu.registers.d === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.d & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x16 */ const LD_D_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.d = cpu.memory.read(cpu.registers.pc++);
};
/* 0x17 */ const RLA = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const carry = cpu.registers.a >> 7;
  cpu.registers.a = (cpu.registers.a << 1) | ((cpu.registers.f >> Flags.CarryBit) & 1);
  cpu.registers.f = carry ? Flags.Carry : 0;
};
/* 0x18 */ const JR_n = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  cpu.registers.pc += (n & 0x80 ? 0xff : 0x00) << 8 | n;
};
/* 0x19 */ const ADD_HL_DE = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.hl + cpu.registers.de;
  cpu.registers.hl = result;
  cpu.registers.f = (
    (cpu.registers.f & Flags.Zero)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xffff ? Flags.Carry : 0)
  );
};
/* 0x1A */ const LD_A_mDE = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.de);
};
/* 0x1B */ const DEC_DE = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.de--;
};
/* 0x1C */ const INC_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e++;
  cpu.registers.f = (
    (cpu.registers.e === 0 ? Flags.Zero : 0)
    | ((cpu.registers.e & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x1D */ const DEC_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e--;
  cpu.registers.f = (
    (cpu.registers.e === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.e & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x1E */ const LD_E_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.e = cpu.memory.read(cpu.registers.pc++);
}
/* 0x1F */ const RRA = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const borrow = cpu.registers.a & 0x01;
  const flagsBorrowBit = (cpu.registers.f >> Flags.CarryBit) & 1;
  cpu.registers.a = (flagsBorrowBit << 7) | (cpu.registers.a >> 1);
  cpu.registers.f = borrow ? Flags.Carry : 0;
};
/* 0x20 */ const JR_NZ_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  if ((cpu.registers.f & Flags.Zero) === 0) {
    cpu.registers.pc += (n & 0x80 ? 0xff : 0x00) << 8 | n;
    cpu.cycles += (1 * 4);
  }
};
/* 0x21 */ const LD_HL_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.hl = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0x22 */ const LD_mHLp_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl++, cpu.registers.a);
};
/* 0x23 */ const INC_HL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.hl++;
};
/* 0x24 */ const INC_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h++;
  cpu.registers.f = (
    (cpu.registers.h === 0 ? Flags.Zero : 0)
    | ((cpu.registers.h & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x25 */ const DEC_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h--;
  cpu.registers.f = (
    (cpu.registers.h === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.h & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x26 */ const LD_H_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.h = cpu.memory.read(cpu.registers.pc++);
};
/* 0x27 */ const DAA = (cpu: SM83) => {
  // https://ehaskins.com/2018-01-30%20Z80%20DAA/
  cpu.cycles += (1 * 4);

  const flags = cpu.registers.f;
  cpu.registers.f = flags & Flags.Operation;

  let correction = 0;
  const halfCarrySet = (flags & Flags.HalfCarry) === Flags.HalfCarry;
  const operationSet = (flags & Flags.Operation) === Flags.Operation;
  const carrySet = (flags & Flags.Carry) === Flags.Carry;

  if (halfCarrySet || (!operationSet && cpu.registers.a > 0x09)) {
    correction = 0x06;
  }

  if (carrySet || (!operationSet && cpu.registers.a > 0x99)) {
    correction |= 0x60;
    cpu.registers.f = Flags.Carry;
  }

  cpu.registers.a += operationSet ? -correction : correction;
  cpu.registers.f |= (cpu.registers.a === 0 ? Flags.Zero : 0);
};
/* 0x28 */ const JR_Z_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  if (cpu.registers.f & Flags.Zero) {
    cpu.registers.pc += (n & 0x80 ? 0xff : 0x00) << 8 | n;
    cpu.cycles += (1 * 4);
  }
};
/* 0x29 */ const ADD_HL_HL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.hl + cpu.registers.hl;
  cpu.registers.hl = result;
  cpu.registers.f = (
    (cpu.registers.f & Flags.Zero)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xffff ? Flags.Carry : 0)
  );
};
/* 0x2A */ const LD_A_mHLp = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.hl++);
};
/* 0x2B */ const DEC_HL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.hl--;
};
/* 0x2C */ const INC_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l++;
  cpu.registers.f = (
    (cpu.registers.l === 0 ? Flags.Zero : 0)
    | ((cpu.registers.l & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x2D */ const DEC_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l--;
  cpu.registers.f = (
    (cpu.registers.l === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.l & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x2E */ const LD_L_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.l = cpu.memory.read(cpu.registers.pc++);
}
/* 0x2F */ const CPL = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = ~cpu.registers.a;
  cpu.registers.f = (
    Flags.HalfCarry | Flags.Operation
  );
};
/* 0x30 */ const JR_NC_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  if ((cpu.registers.f & Flags.Carry) === 0) {
    cpu.registers.pc += (n & 0x80 ? 0xff : 0x00) << 8 | n;
    cpu.cycles += (1 * 4);
  }
};
/* 0x31 */ const LD_SP_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.sp = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0x32 */ const LD_mHLm_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl--, cpu.registers.a);
};
/* 0x33 */ const INC_SP = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.sp++;
};
/* 0x34 */ const INC_mHL = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const value = cpu.memory.read(cpu.registers.hl) + 1;
  cpu.memory.write(cpu.registers.hl, value);
  cpu.registers.f = (
    (value === 0 ? Flags.Zero : 0)
    | ((value & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x35 */ const DEC_mHL = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const value = cpu.memory.read(cpu.registers.hl) - 1;
  cpu.memory.write(cpu.registers.hl, value);
  cpu.registers.f = (
    (value === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((value & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x36 */ const LD_mHL_n = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.memory.write(cpu.registers.hl++, cpu.memory.read(cpu.registers.pc++));
};
/* 0x37 */ const SCF = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const zero = cpu.registers.f & Flags.Zero;
  cpu.registers.f = zero | Flags.Carry;
};
/* 0x38 */ const JR_C_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  if (cpu.registers.f & Flags.Carry) {
    cpu.registers.pc += (n & 0x80 ? 0xff : 0x00) << 8 | n;
    cpu.cycles += (1 * 4);
  }
};
/* 0x39 */ const ADD_HL_SP = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.hl + cpu.registers.sp;
  cpu.registers.hl = result;
  cpu.registers.f = (
    (cpu.registers.f & Flags.Zero)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xffff ? Flags.Carry : 0)
  );
};
/* 0x3A */ const LD_A_mHLm = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.hl--);
};
/* 0x3B */ const DEC_SP = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.sp--;
};
/* 0x3C */ const INC_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a++;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((cpu.registers.a & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x3D */ const DEC_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a--;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | (Flags.Operation)
    | ((cpu.registers.a & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (cpu.registers.f & Flags.Carry)
  );
};
/* 0x3E */ const LD_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.pc++);
}
/* 0x3F */ const CCF = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const flags = cpu.registers.f & ~Flags.Carry;
  cpu.registers.f = (
    flags | (carry ? 0 : Flags.Carry)
  );
};
/* 0x40 */ const LD_B_B = NOP;
/* 0x41 */ const LD_B_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.c;
};
/* 0x42 */ const LD_B_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.d;
};
/* 0x43 */ const LD_B_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.e;
};
/* 0x44 */ const LD_B_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.h;
};
/* 0x45 */ const LD_B_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.l;
};
/* 0x46 */ const LD_B_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.b = cpu.memory.read(cpu.registers.hl);
};
/* 0x47 */ const LD_B_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.b = cpu.registers.a;
};
/* 0x48 */ const LD_C_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.b;
};;
/* 0x49 */ const LD_C_C = NOP;
/* 0x4A */ const LD_C_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.d;
};
/* 0x4B */ const LD_C_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.e;
};
/* 0x4C */ const LD_C_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.h;
};
/* 0x4D */ const LD_C_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.l;
};
/* 0x4E */ const LD_C_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.c = cpu.memory.read(cpu.registers.hl);
};
/* 0x4F */ const LD_C_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.c = cpu.registers.a;
};
/* 0x50 */ const LD_D_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.b;
};
/* 0x51 */ const LD_D_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.c;
};
/* 0x52 */ const LD_D_D = NOP;
/* 0x53 */ const LD_D_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.e;
};
/* 0x54 */ const LD_D_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.h;
};
/* 0x55 */ const LD_D_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.l;
};
/* 0x56 */ const LD_D_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.d = cpu.memory.read(cpu.registers.hl);
};
/* 0x57 */ const LD_D_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.d = cpu.registers.a;
};
/* 0x58 */ const LD_E_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.b;
};
/* 0x59 */ const LD_E_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.c;
};
/* 0x5A */ const LD_E_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.d;
};
/* 0x5B */ const LD_E_E = NOP;
/* 0x5C */ const LD_E_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.h;
};
/* 0x5D */ const LD_E_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.l;
};
/* 0x5E */ const LD_E_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.e = cpu.memory.read(cpu.registers.hl);
};
/* 0x5F */ const LD_E_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.e = cpu.registers.a;
};
/* 0x60 */ const LD_H_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.b;
};
/* 0x61 */ const LD_H_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.c;
};
/* 0x62 */ const LD_H_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.d;
};
/* 0x63 */ const LD_H_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.e;
};
/* 0x64 */ const LD_H_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.h;
};
/* 0x65 */ const LD_H_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.l;
};
/* 0x66 */ const LD_H_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.h = cpu.memory.read(cpu.registers.hl);
};
/* 0x67 */ const LD_H_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.h = cpu.registers.a;
};
/* 0x68 */ const LD_L_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.b;
};
/* 0x69 */ const LD_L_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.c;
};
/* 0x6A */ const LD_L_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.d;
};
/* 0x6B */ const LD_L_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.e;
};
/* 0x6C */ const LD_L_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.h;
};
/* 0x6D */ const LD_L_L = NOP;
/* 0x6E */ const LD_L_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.l = cpu.memory.read(cpu.registers.hl);
};
/* 0x6F */ const LD_L_A = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.l = cpu.registers.a;
};
/* 0x70 */ const LD_mHL_B = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.b);
};
/* 0x71 */ const LD_mHL_C = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.c);
};
/* 0x72 */ const LD_mHL_D = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.d);
};
/* 0x73 */ const LD_mHL_E = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.e);
};
/* 0x74 */ const LD_mHL_H = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.h);
};
/* 0x75 */ const LD_mHL_L = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.l);
};
/* 0x76 */ const HALT = (cpu: SM83) => {
  cpu.isHalted = true;
  cpu.cycles += (1 * 4);
};
/* 0x77 */ const LD_mHL_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.memory.write(cpu.registers.hl, cpu.registers.a);
};
/* 0x78 */ const LD_A_B = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.b;
};
/* 0x79 */ const LD_A_C = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.c;
};
/* 0x7A */ const LD_A_D = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.d;
};
/* 0x7B */ const LD_A_E = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.e;
};
/* 0x7C */ const LD_A_H = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.h;
};
/* 0x7D */ const LD_A_L = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a = cpu.registers.l;
};;
/* 0x7E */ const LD_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a = cpu.memory.read(cpu.registers.hl);
};
/* 0x7F */ const LD_A_A = NOP;

const makeAddA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const result = cpu.registers.a + cpu.registers[reg];
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};

const makeAdcA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a + cpu.registers[reg] + carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};

/* 0x80 */ const ADD_A_B = makeAddA('b');
/* 0x81 */ const ADD_A_C = makeAddA('c');
/* 0x82 */ const ADD_A_D = makeAddA('d');
/* 0x83 */ const ADD_A_E = makeAddA('e');
/* 0x84 */ const ADD_A_H = makeAddA('h');
/* 0x85 */ const ADD_A_L = makeAddA('l');
/* 0x86 */ const ADD_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a + cpu.memory.read(cpu.registers.hl);
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};
/* 0x87 */ const ADD_A_A = makeAddA('a');
/* 0x88 */ const ADC_A_B = makeAdcA('b');
/* 0x89 */ const ADC_A_C = makeAdcA('c');
/* 0x8A */ const ADC_A_D = makeAdcA('d');
/* 0x8B */ const ADC_A_E = makeAdcA('e');
/* 0x8C */ const ADC_A_H = makeAdcA('h');
/* 0x8D */ const ADC_A_L = makeAdcA('l');
/* 0x8E */ const ADC_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a + cpu.memory.read(cpu.registers.hl) + carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};
/* 0x8F */ const ADC_A_A = makeAdcA('a');

const makeSubA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const result = cpu.registers.a - cpu.registers[reg];
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};

const makeSbcA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a - cpu.registers[reg] - carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};

/* 0x90 */ const SUB_A_B = makeSubA('b');
/* 0x91 */ const SUB_A_C = makeSubA('c');
/* 0x92 */ const SUB_A_D = makeSubA('d');
/* 0x93 */ const SUB_A_E = makeSubA('e');
/* 0x94 */ const SUB_A_H = makeSubA('h');
/* 0x95 */ const SUB_A_L = makeSubA('l');
/* 0x96 */ const SUB_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.hl);
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0x97 */ const SUB_A_A = makeSubA('a');
/* 0x98 */ const SBC_A_B = makeSbcA('b');
/* 0x99 */ const SBC_A_C = makeSbcA('c');
/* 0x9A */ const SBC_A_D = makeSbcA('d');
/* 0x9B */ const SBC_A_E = makeSbcA('e');
/* 0x9C */ const SBC_A_H = makeSbcA('h');
/* 0x9D */ const SBC_A_L = makeSbcA('l');
/* 0x9E */ const SBC_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.hl) - carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0x9F */ const SBC_A_A = makeSbcA('a');

const makeAndA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a &= cpu.registers[reg];
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | Flags.HalfCarry
  );
};

/* 0xA0 */ const AND_A_B = makeAndA('b');
/* 0xA1 */ const AND_A_C = makeAndA('c');
/* 0xA2 */ const AND_A_D = makeAndA('d');
/* 0xA3 */ const AND_A_E = makeAndA('e');
/* 0xA4 */ const AND_A_H = makeAndA('h');
/* 0xA5 */ const AND_A_L = makeAndA('l');
/* 0xA6 */ const AND_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a &= cpu.memory.read(cpu.registers.hl);
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | Flags.HalfCarry
  );
};
/* 0xA7 */ const AND_A_A = makeAndA('a');

const makeXorA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a ^= cpu.registers[reg];
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
  );
};

/* 0xA8 */ const XOR_A_B = makeXorA('b');
/* 0xA9 */ const XOR_A_C = makeXorA('c');
/* 0xAA */ const XOR_A_D = makeXorA('d');
/* 0xAB */ const XOR_A_E = makeXorA('e');
/* 0xAC */ const XOR_A_H = makeXorA('h');
/* 0xAD */ const XOR_A_L = makeXorA('l');
/* 0xAE */ const XOR_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a ^= cpu.memory.read(cpu.registers.hl);
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((cpu.registers.a & 0x10) === 0x10 ? Flags.HalfCarry : 0)
  );
};
/* 0xAF */ const XOR_A_A = makeXorA('a');

const makeOrA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.a |= cpu.registers[reg];
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
  );
};

/* 0xB0 */ const OR_A_B = makeOrA('b');
/* 0xB1 */ const OR_A_C = makeOrA('c');
/* 0xB2 */ const OR_A_D = makeOrA('d');
/* 0xB3 */ const OR_A_E = makeOrA('e');
/* 0xB4 */ const OR_A_H = makeOrA('h');
/* 0xB5 */ const OR_A_L = makeOrA('l');
/* 0xB6 */ const OR_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a |= cpu.memory.read(cpu.registers.hl);
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((cpu.registers.a & 0x10) === 0x10 ? Flags.HalfCarry : 0)
  );
};
/* 0xB7 */ const OR_A_A = makeOrA('a');

const makeCpA = (reg: RegName) => (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  const result = cpu.registers.a - cpu.registers[reg];
  cpu.registers.f = (
    ((result & 0xff) === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};

/* 0xB8 */ const CP_A_B = makeCpA('b');
/* 0xB9 */ const CP_A_C = makeCpA('c');
/* 0xBA */ const CP_A_D = makeCpA('d');
/* 0xBB */ const CP_A_E = makeCpA('e');
/* 0xBC */ const CP_A_H = makeCpA('h');
/* 0xBD */ const CP_A_L = makeCpA('l');
/* 0xBE */ const CP_A_mHL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.hl);
  cpu.registers.f = (
    ((result & 0xff) === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0xBF */ const CP_A_A = makeCpA('a');

/* 0xC0 */ const RET_NZ = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  if ((cpu.registers.f & Flags.Zero) === 0) {
    cpu.cycles += (3 * 4);
    cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
    cpu.registers.sp += 2;
  }
};
/* 0xC1 */ const POP_BC = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.bc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
};
/* 0xC2 */ const JP_NZ_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if ((cpu.registers.f & Flags.Zero) === 0) {
    cpu.registers.pc = addr;
    cpu.cycles += (1 * 4);
  }
};
/* 0xC3 */ const JP_nn = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.pc = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0xC4 */ const CALL_NZ_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if ((cpu.registers.f & Flags.Zero) === 0) {
    cpu.registers.sp--;
    cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
    cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
    cpu.registers.pc = addr;
    cpu.cycles += (3 * 4);
  }
};
/* 0xC5 */ const PUSH_BC = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.b);
  cpu.memory.write(cpu.registers.sp, cpu.registers.c);
};
/* 0xC6 */ const ADD_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a + cpu.memory.read(cpu.registers.pc++);
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};

const makeRst = (offset: number) => (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
  cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
  cpu.registers.pc = offset;
};

/* 0xC7 */ const RST_00h = makeRst(0x00);
/* 0xC8 */ const RET_Z = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  if (cpu.registers.f & Flags.Zero) {
    cpu.cycles += (3 * 4);
    cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
    cpu.registers.sp += 2;
  }
};
/* 0xC9 */ const RET = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
};
/* 0xCA */ const JP_Z_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if (cpu.registers.f & Flags.Zero) {
    cpu.registers.pc = addr;
    cpu.cycles += (1 * 4);
  }
};
/* 0xCB */ const CB = (cpu: SM83) => {
  const operation = cpu.memory.read(cpu.registers.pc++);
  return cbOps[operation](cpu);
};
/* 0xCC */ const CALL_Z_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if (cpu.registers.f & Flags.Zero) {
    cpu.registers.sp--;
    cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
    cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
    cpu.registers.pc = addr;
    cpu.cycles += (3 * 4);
  }
};
/* 0xCD */ const CALL_nn = (cpu: SM83) => {
  cpu.cycles += (6 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
  cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
  cpu.registers.pc = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
};
/* 0xCE */ const ADC_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a + cpu.memory.read(cpu.registers.pc++) + carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xff ? Flags.Carry : 0)
  );
};
/* 0xCF */ const RST_08h = makeRst(0x08);


/* 0xD0 */ const RET_NC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  if ((cpu.registers.f & Flags.Carry) === 0) {
    cpu.cycles += (3 * 4);
    cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
    cpu.registers.sp += 2;
  }
};
/* 0xD1 */ const POP_DE = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.de = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
};
/* 0xD2 */ const JP_NC_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if ((cpu.registers.f & Flags.Carry) === 0) {
    cpu.registers.pc = addr;
    cpu.cycles += (1 * 4);
  }
};
/* 0xD3 */ const XX0 = NOP; // TODO: What to do with these
/* 0xD4 */ const CALL_NC_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if ((cpu.registers.f & Flags.Carry) === 0) {
    cpu.registers.sp--;
    cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
    cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
    cpu.registers.pc = addr;
    cpu.cycles += (3 * 4);
  }
};
/* 0xD5 */ const PUSH_DE = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.d);
  cpu.memory.write(cpu.registers.sp, cpu.registers.e);
};
/* 0xD6 */ const SUB_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.pc++);
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0xD7 */ const RST_10h = makeRst(0x10);
/* 0xD8 */ const RET_C = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  if (cpu.registers.f & Flags.Carry) {
    cpu.cycles += (3 * 4);
    cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
    cpu.registers.sp += 2;
  }
};
/* 0xD9 */ const RETI = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.pc = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
  cpu.IME = true;
};
/* 0xDA */ const JP_C_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if (cpu.registers.f & Flags.Carry) {
    cpu.registers.pc = addr;
    cpu.cycles += (1 * 4);
  }
};
/* 0xDB */ const XX1 = NOP;
/* 0xDC */ const CALL_C_nn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  if (cpu.registers.f & Flags.Carry) {
    cpu.registers.sp--;
    cpu.memory.write(cpu.registers.sp--, cpu.registers.pc >> 8);
    cpu.memory.write(cpu.registers.sp, cpu.registers.pc & 0xff);
    cpu.registers.pc = addr;
    cpu.cycles += (3 * 4);
  }
};
/* 0xDD */ const XX2 = NOP;
/* 0xDE */ const SBC_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const carry = (cpu.registers.f & Flags.Carry) >> Flags.CarryBit;
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.pc++) - carry;
  cpu.registers.a = result;
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0xDF */ const RST_18h = makeRst(0x18);

/* 0xE0 */ const LD_mFFn_A = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = 0xff00 | cpu.memory.read(cpu.registers.pc++);
  cpu.memory.write(addr, cpu.registers.a);
};
/* 0xE1 */ const POP_HL = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.hl = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
};
/* 0xE2 */ const LD_mFFC_A = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const addr = 0xff00 | cpu.registers.c;
  cpu.memory.write(addr, cpu.registers.a);
};
/* 0xE3 */ const XX3 = NOP;
/* 0xE4 */ const XX4 = NOP;
/* 0xE5 */ const PUSH_HL = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.h);
  cpu.memory.write(cpu.registers.sp, cpu.registers.l);
};
/* 0xE6 */ const AND_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a &= cpu.memory.read(cpu.registers.pc++);
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
    | Flags.HalfCarry
  );
};
/* 0xE7 */ const RST_20h = makeRst(0x20);
/* 0xE8 */ const ADD_SP_n = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  const result = cpu.registers.sp + ((n & 0x80 ? 0xff00 : 0) | n);
  cpu.registers.sp = result;
  cpu.registers.f = (
    ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result > 0xffff ? Flags.Carry : 0)
  );
};
/* 0xE9 */ const JP_HL = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.registers.pc = cpu.registers.hl;
};
/* 0xEA */ const LD_nn_A = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  cpu.memory.write(addr, cpu.registers.a);
};
/* 0xEB */ const XX5 = NOP;
/* 0xEC */ const XX6 = NOP;
/* 0xED */ const XX7 = NOP;
/* 0xEE */ const XOR_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a ^= cpu.memory.read(cpu.registers.pc++);
  cpu.registers.f = cpu.registers.a === 0 ? Flags.Zero : 0;
};
/* 0xEF */ const RST_28h = makeRst(0x28);

/* 0xF0 */ const LD_A_mFFn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const addr = 0xff00 | cpu.memory.read(cpu.registers.pc++);
  cpu.registers.a = cpu.memory.read(addr);
};
/* 0xF1 */ const POP_AF = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  cpu.registers.af = cpu.memory.read(cpu.registers.sp) | cpu.memory.read(cpu.registers.sp + 1) << 8;
  cpu.registers.sp += 2;
};
/* 0xF2 */ const LD_A_mFFC = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const addr = 0xff00 | cpu.registers.c;
  cpu.registers.a = cpu.memory.read(addr);
};
/* 0xF3 */ const DI = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.IME = false;
};
/* 0xF4 */ const XX8 = NOP;
/* 0xF5 */ const PUSH_AF = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  cpu.registers.sp--;
  cpu.memory.write(cpu.registers.sp--, cpu.registers.a);
  cpu.memory.write(cpu.registers.sp, cpu.registers.f);
};
/* 0xF6 */ const OR_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.a |= cpu.memory.read(cpu.registers.pc++);
  cpu.registers.f = (
    (cpu.registers.a === 0 ? Flags.Zero : 0)
  );
};
/* 0xF7 */ const RST_30h = makeRst(0x30);
/* 0xF8 */ const LD_HL_SPn = (cpu: SM83) => {
  cpu.cycles += (3 * 4);
  const n = cpu.memory.read(cpu.registers.pc++);
  const addr = cpu.registers.sp + ((n & 0x80 ? 0xff00 : 0) | n);
  cpu.registers.hl = addr & 0xffff;
  cpu.registers.f = (
    ((addr & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (addr > 0xffff ? Flags.Carry : 0)
  );
};
/* 0xF9 */ const LD_SP_HL = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  cpu.registers.sp = cpu.registers.hl;
};
/* 0xFA */ const LD_A_nn = (cpu: SM83) => {
  cpu.cycles += (4 * 4);
  const addr = cpu.memory.read(cpu.registers.pc++) | cpu.memory.read(cpu.registers.pc++) << 8;
  cpu.registers.a = cpu.memory.read(addr);
};
/* 0xFB */ const EI = (cpu: SM83) => {
  cpu.cycles += (1 * 4);
  cpu.IME = true;
};
/* 0xFC */ const XX9 = NOP;
/* 0xFD */ const XXA = NOP;
/* 0xFE */ const CP_A_n = (cpu: SM83) => {
  cpu.cycles += (2 * 4);
  const result = cpu.registers.a - cpu.memory.read(cpu.registers.pc++);
  cpu.registers.f = (
    ((result & 0xff) === 0 ? Flags.Zero : 0)
    | ((result & 0x10) === 0x10 ? Flags.HalfCarry : 0)
    | (result < 0 ? Flags.Carry : 0)
  );
};
/* 0xFF */ const RST_38h = makeRst(0x38);

export const ops: Array<(cpu: SM83) => void> = [
  /* 00 */ NOP, LD_BC_nn, LD_mBC_A, INC_BC, INC_B, DEC_B, LD_B_n, RLCA,
  /* 08 */ LD_mnn_SP, ADD_HL_BC, LD_A_mBC, DEC_BC, INC_C, DEC_C, LD_C_n, RRCA,
  /* 10 */ STOP, LD_DE_nn, LD_mDE_A, INC_DE, INC_D, DEC_D, LD_D_n, RLA,
  /* 18 */ JR_n, ADD_HL_DE, LD_A_mDE, DEC_DE, INC_E, DEC_E, LD_E_n, RRA,
  /* 20 */ JR_NZ_n, LD_HL_nn, LD_mHLp_A, INC_HL, INC_H, DEC_H, LD_H_n, DAA,
  /* 28 */ JR_Z_n, ADD_HL_HL, LD_A_mHLp, DEC_HL, INC_L, DEC_L, LD_L_n, CPL,
  /* 30 */ JR_NC_n, LD_SP_nn, LD_mHLm_A, INC_SP, INC_mHL, DEC_mHL, LD_mHL_n, SCF,
  /* 38 */ JR_C_n, ADD_HL_SP, LD_A_mHLm, DEC_SP, INC_A, DEC_A, LD_A_n, CCF,
  /* 40 */ LD_B_B, LD_B_C, LD_B_D, LD_B_E, LD_B_H, LD_B_L, LD_B_mHL, LD_B_A,
  /* 48 */ LD_C_B, LD_C_C, LD_C_D, LD_C_E, LD_C_H, LD_C_L, LD_C_mHL, LD_C_A,
  /* 50 */ LD_D_B, LD_D_C, LD_D_D, LD_D_E, LD_D_H, LD_D_L, LD_D_mHL, LD_D_A,
  /* 58 */ LD_E_B, LD_E_C, LD_E_D, LD_E_E, LD_E_H, LD_E_L, LD_E_mHL, LD_E_A,
  /* 60 */ LD_H_B, LD_H_C, LD_H_D, LD_H_E, LD_H_H, LD_H_L, LD_H_mHL, LD_H_A,
  /* 68 */ LD_L_B, LD_L_C, LD_L_D, LD_L_E, LD_L_H, LD_L_L, LD_L_mHL, LD_L_A,
  /* 70 */ LD_mHL_B, LD_mHL_C, LD_mHL_D, LD_mHL_E, LD_mHL_H, LD_mHL_L, HALT, LD_mHL_A,
  /* 78 */ LD_A_B, LD_A_C, LD_A_D, LD_A_E, LD_A_H, LD_A_L, LD_A_mHL, LD_A_A,
  /* 80 */ ADD_A_B, ADD_A_C, ADD_A_D, ADD_A_E, ADD_A_H, ADD_A_L, ADD_A_mHL, ADD_A_A,
  /* 88 */ ADC_A_B, ADC_A_C, ADC_A_D, ADC_A_E, ADC_A_H, ADC_A_L, ADC_A_mHL, ADC_A_A,
  /* 90 */ SUB_A_B, SUB_A_C, SUB_A_D, SUB_A_E, SUB_A_H, SUB_A_L, SUB_A_mHL, SUB_A_A,
  /* 98 */ SBC_A_B, SBC_A_C, SBC_A_D, SBC_A_E, SBC_A_H, SBC_A_L, SBC_A_mHL, SBC_A_A,
  /* A0 */ AND_A_B, AND_A_C, AND_A_D, AND_A_E, AND_A_H, AND_A_L, AND_A_mHL, AND_A_A,
  /* A8 */ XOR_A_B, XOR_A_C, XOR_A_D, XOR_A_E, XOR_A_H, XOR_A_L, XOR_A_mHL, XOR_A_A,
  /* B0 */ OR_A_B, OR_A_C, OR_A_D, OR_A_E, OR_A_H, OR_A_L, OR_A_mHL, OR_A_A,
  /* B8 */ CP_A_B, CP_A_C, CP_A_D, CP_A_E, CP_A_H, CP_A_L, CP_A_mHL, CP_A_A,
  /* C0 */ RET_NZ, POP_BC, JP_NZ_nn, JP_nn, CALL_NZ_nn, PUSH_BC, ADD_A_n, RST_00h,
  /* C8 */ RET_Z, RET, JP_Z_nn, CB, CALL_Z_nn, CALL_nn, ADC_A_n, RST_08h,
  /* D0 */ RET_NC, POP_DE, JP_NC_nn, XX0, CALL_NC_nn, PUSH_DE, SUB_A_n, RST_10h,
  /* D8 */ RET_C, RETI, JP_C_nn, XX1, CALL_C_nn, XX2, SBC_A_n, RST_18h,
  /* E0 */ LD_mFFn_A, POP_HL, LD_mFFC_A, XX3, XX4, PUSH_HL, AND_A_n, RST_20h,
  /* E8 */ ADD_SP_n, JP_HL, LD_nn_A, XX5, XX6, XX7, XOR_A_n, RST_28h,
  /* F0 */ LD_A_mFFn, POP_AF, LD_A_mFFC, DI, XX8, PUSH_AF, OR_A_n, RST_30h,
  /* F8 */ LD_HL_SPn, LD_SP_HL, LD_A_nn, EI, XX9, XXA, CP_A_n, RST_38h,
];
