import { IMemoryInterface } from '../../src/memory-interface/index';
import test from 'tape';
import {regs, createMockMemory, RegName} from './utils';
import { SM83, Flags} from '../../src/sharp-sm83/index';

type InstructionTestCb = (t: test.Test, opcode: number, cpu: SM83, memory: IMemoryInterface) => void;
const instructionTest = (opcode: number, name: string, mValues: Record<number, number>, cb: InstructionTestCb) => {
  test(`Instructions: 0x${opcode.toString(16).padStart(2, '0')} [${name}]`, t => {
    const memory = createMockMemory(mValues);
    const cpu = new SM83(memory);
    cb(t, opcode, cpu, memory);
    t.end();
  });
};

const incReg16Test = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 1);

    cpu.registers[reg] = 0xffff;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0);
  });
};

const decReg16Test = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0xffff);
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0xfffe);
  });
};

const incReg8Test = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers[reg] === 1);
    t.assert((cpu.registers.f & Flags.Zero) === 0);
    t.assert((cpu.registers.f & Flags.HalfCarry) === 0);
    t.assert((cpu.registers.f & Flags.Operation) === 0);
    t.assert((cpu.registers.f & Flags.Carry) === 0);

    cpu.registers[reg] = 0xf;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0x10);
    t.assert((cpu.registers.f & Flags.Zero) === 0);
    t.assert((cpu.registers.f & Flags.HalfCarry) === Flags.HalfCarry);
    t.assert((cpu.registers.f & Flags.Operation) === 0);
    t.assert((cpu.registers.f & Flags.Carry) === 0);

    cpu.registers[reg] = 0xff;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0);
    t.assert((cpu.registers.f & Flags.Zero) === Flags.Zero);
    t.assert((cpu.registers.f & Flags.HalfCarry) === 0);
    t.assert((cpu.registers.f & Flags.Operation) === 0);
    t.assert((cpu.registers.f & Flags.Carry) === 0);
  });
};

const decReg8Test = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers[reg] === 0xff);
    t.assert((cpu.registers.f & Flags.Zero) === 0);
    t.assert((cpu.registers.f & Flags.HalfCarry) === Flags.HalfCarry);
    t.assert((cpu.registers.f & Flags.Operation) === Flags.Operation);
    t.assert((cpu.registers.f & Flags.Carry) === 0);

    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0x00);
    t.assert((cpu.registers.f & Flags.Zero) === Flags.Zero);
    t.assert((cpu.registers.f & Flags.HalfCarry) === 0);
    t.assert((cpu.registers.f & Flags.Operation) === Flags.Operation);
    t.assert((cpu.registers.f & Flags.Carry) === 0);
  });
};

const loadReg8ImmTest = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, { 0: 0xaa }, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0xaa);
  });
};

const loadReg8Reg8 = (opcode: number, name: string, regA: RegName, regB: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers[regB] = 0xaa;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers[regA] === 0xaa);
  });
};

const loadReg8HLPtr = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, { 0x1000: 0xaa }, (t, opcode, cpu) => {
    cpu.registers.hl = 0x1000;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0xaa);
  });
};

const loadHLPtrReg = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.hl = 0x1000;
    cpu.registers[reg] = 0xaa;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.memory.read(0x1000) === 0xaa);
  });
};

const loadReg16ImmTest = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, { 0: 0xbb, 1: 0xaa }, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers[reg] === 0xaabb);
  });
};

const loadReg16PtrRegTest = (opcode: number, name: string, reg16: RegName, reg8: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu, memory) => {
    cpu.registers[reg8] = 0xaa;
    cpu.registers[reg16] = 0x1234;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(memory.read(0x1234) === 0xaa);
  });
};

const loadReg8Reg16PtrTest = (opcode: number, name: string, reg8: RegName, reg16: RegName) => {
  return instructionTest(opcode, name, { 0xaabb: 0x41 }, (t, opcode, cpu) => {
    cpu.registers[reg16] = 0xaabb;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg8] === 0x41);
  })
};

const addReg16Reg16 = (opcode: number, name: string, regA: RegName, regB: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers[regA] = 0x1234;
    cpu.registers[regB] = 0x5678;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[regA] === 0x68AC);
    t.assert(cpu.registers.f === 0);

    cpu.registers[regA] = 0xffff;
    cpu.registers[regB] = 0x0001;
    cpu.execute(opcode);
    t.assert(cpu.registers[regA] === 0x0000);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[regA] = 0x0001;
    cpu.registers[regB] = 0x0002;
    cpu.registers.f = Flags.Zero;
    cpu.execute(opcode);
    t.assert(cpu.registers[regA] === 0x0003);
    t.assert(cpu.registers.f === Flags.Zero);
  })
};

const addSameReg16 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers[reg] = 0x1234;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0x2468);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0x8000;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0x0000);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0x0001;
    cpu.registers.f = Flags.Zero;
    cpu.execute(opcode);
    t.assert(cpu.registers[reg] === 0x0002);
    t.assert(cpu.registers.f === Flags.Zero);
  })
};

const jumpRelativeIfFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x10, 0x11: 0xfb, 0x12: 0xfb }, (t, opcode, cpu) => {
    cpu.registers.f = flag;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x11);

    cpu.registers.f = 0;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers.pc === 0x12);

    cpu.registers.f = flag;
    cpu.execute(opcode);
    t.assert(cpu.registers.pc === 0x0e);
  });
};

const jumpRelativeIfNotFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x10, 0x11: 0xfb, 0x12: 0xfb }, (t, opcode, cpu) => {
    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x11);

    cpu.registers.f = flag;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers.pc === 0x12);

    cpu.registers.f = 0;
    cpu.execute(opcode);
    t.assert(cpu.registers.pc === 0x0e);
  });
};

const addAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0x01;
    cpu.registers[reg] = 0x0f;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x10);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers.a = 0x01;
    cpu.registers[reg] = 0xff;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
  });
};

const adcAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.registers.f = Flags.Carry;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0x01;
    cpu.registers[reg] = 0x0f;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x10);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers.a = 0x01;
    cpu.registers[reg] = 0xfe;
    cpu.registers.f = Flags.Carry;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
  });
};

const subAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x02;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0x1f;
    cpu.registers[reg] = 0x0f;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x10);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0xff);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
  });
};

const sbcAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x02;
    cpu.registers[reg] = 0x00;
    cpu.registers.f = Flags.Carry;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0x1f;
    cpu.registers[reg] = 0x0e;
    cpu.registers.f = Flags.Carry;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x10);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.registers.f = Flags.Carry;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0xff);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
  });
};

const andAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

    cpu.registers.a = 0b11001100;
    cpu.registers[reg] = 0b10111011;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0b10001000);
    t.assert(cpu.registers.f === Flags.HalfCarry);
  });
};

const xorAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a =    0b11001100;
    cpu.registers[reg] = 0b10111011;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0b01110111);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0xff;
    cpu.registers[reg] = 0xff;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);
  });
};

const orAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x01);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a =    0b11001100;
    cpu.registers[reg] = 0b10011011;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0b11011111);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0xff;
    cpu.registers[reg] = 0xff;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0xff);
    t.assert(cpu.registers.f === 0);
  });
};

const cpAReg8 = (opcode: number, name: string, reg: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x00;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (1 * 4));
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers.a = 0x02;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x02);
    t.assert(cpu.registers.f === 0);

    cpu.registers.a = 0x1f;
    cpu.registers[reg] = 0x0f;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x1f);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers.a = 0x00;
    cpu.registers[reg] = 0x01;
    cpu.execute(opcode);
    t.assert(cpu.registers.a === 0x00);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
  });
};

const retIfNotFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0xfffd: 0x34, 0xfffe: 0x12, }, (t, opcode, cpu) => {
    cpu.registers.sp = 0xfffd;
    cpu.registers.f = flag;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers.pc === 0x0000);

    cpu.registers.f = 0;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (5 * 4));
    t.assert(cpu.registers.pc === 0x1234);
  });
};

const retIfFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0xfffd: 0x34, 0xfffe: 0x12, }, (t, opcode, cpu) => {
    cpu.registers.sp = 0xfffd;
    cpu.registers.f = 0;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (2 * 4));
    t.assert(cpu.registers.pc === 0x0000);

    cpu.registers.f = flag;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (5 * 4));
    t.assert(cpu.registers.pc === 0x1234);
  });
};

const callIfNotFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x34, 1: 0x12,  2: 0x78, 3: 0x56 }, (t, opcode, cpu) => {
    cpu.registers.sp = 0xffff;
    cpu.registers.f = flag;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x0002);
    t.assert(cpu.registers.sp === 0xffff);

    cpu.registers.f = 0;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (6 * 4));
    t.assert(cpu.registers.pc === 0x5678);
    t.assert(cpu.registers.sp === 0xfffd);
  });
};

const callIfFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x34, 1: 0x12,  2: 0x78, 3: 0x56 }, (t, opcode, cpu) => {
    cpu.registers.sp = 0xffff;
    cpu.registers.f = 0;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x0002);
    t.assert(cpu.registers.sp === 0xffff);

    cpu.registers.f = flag;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (6 * 4));
    t.assert(cpu.registers.pc === 0x5678);
    t.assert(cpu.registers.sp === 0xfffd);
  });
};

const popReg = (opcode: number, name: string, reg16: RegName) => {
  return instructionTest(opcode, name, { 0xfffd: 0x34, 0xfffe: 0x12, }, (t, opcode, cpu) => {
    cpu.registers.sp = 0xfffd;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers[reg16] === 0x1234);
    t.assert(cpu.registers.sp === 0xffff);
  });
};

const pushReg = (opcode: number, name: string, reg16: RegName) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.sp = 0xffff;
    cpu.registers[reg16] = 0x1234

    cpu.execute(opcode);
    t.assert(cpu.cycles === (4 * 4));
    t.assert(cpu.registers.sp === 0xfffd);
    t.assert(cpu.memory.read(cpu.registers.sp) === 0x34);
    t.assert(cpu.memory.read(cpu.registers.sp + 1) === 0x12);
  });
};

const jumpIfFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x34, 1: 0x12, 2: 0x78, 3: 0x56 }, (t, opcode, cpu) => {
    cpu.registers.f = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x0002);

    cpu.registers.f = flag;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (4 * 4));
    t.assert(cpu.registers.pc === 0x5678);
  });
};

const jumpIfNotFlag = (opcode: number, name: string, flag: Flags) => {
  return instructionTest(opcode, name, { 0: 0x34, 1: 0x12, 2: 0x78, 3: 0x56 }, (t, opcode, cpu) => {
    cpu.registers.f = flag;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (3 * 4));
    t.assert(cpu.registers.pc === 0x0002);

    cpu.registers.f = 0;
    cpu.cycles = 0;
    cpu.execute(opcode);
    t.assert(cpu.cycles === (4 * 4));
    t.assert(cpu.registers.pc === 0x5678);
  });
};

const rst = (opcode: number, name: string, offset: number) => {
  return instructionTest(opcode, name, {}, (t, opcode, cpu) => {
    cpu.registers.pc = 0x1234;
    cpu.registers.sp = 0xffff;

    cpu.execute(opcode);
    t.assert(cpu.cycles === (4 * 4));
    t.assert(cpu.registers.pc === offset);
    t.assert(cpu.registers.sp === 0xfffd);
    t.assert(cpu.memory.read(cpu.registers.sp) === 0x34);
    t.assert(cpu.memory.read(cpu.registers.sp + 1) === 0x12);
  });
};

const XX = (opcode: number, name: string) => {
  return instructionTest(opcode, name, {}, t => {
    t.ok('Undocumented / Invalid XX type instruction');
  });
};

instructionTest(0x00, 'NOP', {}, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  regs.forEach(r => t.assert(cpu.registers[r] === 0));
});
loadReg16ImmTest(0x01, 'LD_BC_nn', 'bc');
loadReg16PtrRegTest(0x02, 'LD_mBC_A', 'bc', 'a');
incReg16Test(0x03, 'INC_BC', 'bc');
incReg8Test(0x04, 'INC_B', 'b');
decReg8Test(0x05, 'DEC_B', 'b');
loadReg8ImmTest(0x06, 'LD_B_n', 'b');
instructionTest(0x07, 'RLCA', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0b10101010;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01010101);
  t.assert(cpu.registers.f === Flags.Carry);
  t.assert(cpu.cycles === (1 * 4));

  cpu.registers.a = 0b0001000;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b0010000);
  t.assert(cpu.registers.f === 0);
});
instructionTest(0x08, 'LD_mnn_SP', { 0: 0xaa, 1: 0xbb }, (t, opcode, cpu, memory) => {
  cpu.registers.sp = 0x1234;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (5 * 4));
  t.assert(memory.read(0xbbaa) === 0x34);
  t.assert(memory.read(0xbbaa + 1) === 0x12);
});
addReg16Reg16(0x09, 'ADD_HL_BC', 'hl', 'bc');
loadReg8Reg16PtrTest(0x0A, 'LD_A_mBC', 'a', 'bc');
decReg16Test(0x0B, 'DEC_BC', 'bc');
incReg8Test(0x0C, 'INC_C', 'c');
decReg8Test(0x0D, 'DEC_C', 'c');
loadReg8ImmTest(0x0E, 'LD_C_n', 'c');
instructionTest(0x0F, 'RRCA', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0b10101010;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01010101);
  t.assert(cpu.registers.f === 0);
  t.assert(cpu.cycles === (1 * 4));

  cpu.registers.a = 0b00001000;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b00000100);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0b00000001;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b10000000);
  t.assert(cpu.registers.f === Flags.Carry);
});
instructionTest(0x10, 'STOP', {}, (t, opcode, cpu) => {
  t.assert(!cpu.isStopped);
  cpu.execute(opcode);
  t.assert(cpu.isStopped);
  t.assert(cpu.cycles === (1 * 4));
});
loadReg16ImmTest(0x11, 'LD_DE_nn', 'de');
loadReg16PtrRegTest(0x12, 'LD_mDE_A', 'de', 'a');
incReg16Test(0x13, 'INC_DE', 'de');
incReg8Test(0x14, 'INC_D', 'd');
decReg8Test(0x15, 'DEC_D', 'd');
loadReg8ImmTest(0x16, 'LD_D_n', 'd');
instructionTest(0x17, 'RLA', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0b10101010;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01010100);
  t.assert(cpu.registers.f === Flags.Carry);
  t.assert(cpu.cycles === (1 * 4));

  cpu.registers.a = 0b00001000;
  cpu.registers.f = 0;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b00010000);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 1);
  t.assert(cpu.registers.f === 0);
});
instructionTest(0x18, 'JR_n', { 0: 0x10, 0x11: 0xfb }, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (3 * 4));
  t.assert(cpu.registers.pc === 0x11);

  cpu.execute(opcode);
  t.assert(cpu.registers.pc === 0x0d);
});
addReg16Reg16(0x19, 'ADD_HL_DE', 'hl', 'de');
loadReg8Reg16PtrTest(0x1A, 'LD_A_mDE', 'a', 'de');
decReg16Test(0x1B, 'DEC_DE', 'de');
incReg8Test(0x1C, 'INC_E', 'e');
decReg8Test(0x1D, 'DEC_E', 'e');
loadReg8ImmTest(0x1E, 'LD_E_n', 'e');
instructionTest(0x1F, 'RRA', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0b10101010;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01010101);
  t.assert(cpu.registers.f === 0);
  t.assert(cpu.cycles === (1 * 4));

  cpu.registers.a = 0b00000001;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b00000000);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.registers.a = 0b00000000;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b10000000);
  t.assert(cpu.registers.f === 0);
});
jumpRelativeIfNotFlag(0x20, 'JR_NZ_n', Flags.Zero);
loadReg16ImmTest(0x21, 'LD_HL_nn', 'hl');
instructionTest(0x22, 'LD_mHLp_A', {}, (t, opcode, cpu, memory) => {
  cpu.registers.hl = 0x1000;
  cpu.registers.a = 0xaa;

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x1001);
  t.assert(memory.read(0x1000) === 0xaa);
  t.assert(cpu.cycles === (2 * 4));
});
incReg16Test(0x23, 'INC_HL', 'hl');
incReg8Test(0x24, 'INC_H', 'h');
decReg8Test(0x25, 'DEC_H', 'h');
loadReg8ImmTest(0x26, 'LD_H_n', 'h');
instructionTest(0x27, 'DAA', {0: 0x06, 1: 0x03}, (t, opcode, cpu) => {
  cpu.registers.a = 0x05;
  cpu.execute(0xC6); // ADD A, n
  t.assert(cpu.registers.a === 0x0B);

  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x11);

  cpu.execute(0xD6); // SUB A, n
  t.assert(cpu.registers.a === 0x0E);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x14); // 17 (0x11) - 3 (0x03) = 14
});
jumpRelativeIfFlag(0x28, 'JR_Z_n', Flags.Zero);
addSameReg16(0x29, 'ADD_HL_HL', 'hl');
instructionTest(0x2A, 'LD_A_mHLp', { 0x1000: 0xaa }, (t, opcode, cpu, memory) => {
  cpu.registers.hl = 0x1000;

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x1001);
  t.assert(cpu.registers.a === 0xaa);
  t.assert(cpu.cycles === (2 * 4));
});
decReg16Test(0x2B, 'DEC_HL', 'hl');
incReg8Test(0x2C, 'INC_L', 'l');
decReg8Test(0x2D, 'DEC_L', 'l');
loadReg8ImmTest(0x2E, 'LD_L_n', 'l');
instructionTest(0x2F, 'CPL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0b00111100;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b11000011);
  t.assert(cpu.registers.f === (
    Flags.HalfCarry | Flags.Operation
  ));
  t.assert(cpu.cycles === (1 * 4));
});
jumpRelativeIfNotFlag(0x30, 'JR_NC_n', Flags.Carry);
loadReg16ImmTest(0x31, 'LD_SP_nn', 'sp');
instructionTest(0x32, 'LD_mHLm_A', {}, (t, opcode, cpu, memory) => {
  cpu.registers.hl = 0x1000;
  cpu.registers.a = 0xaa;

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x0FFF);
  t.assert(cpu.memory.read(0x1000) === 0xaa);
  t.assert(cpu.cycles === (2 * 4));
});
incReg16Test(0x33, 'INC_SP', 'sp');
instructionTest(0x34, 'INC_mHL', { 0x1000: 1 }, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1000;
  cpu.execute(opcode);
  t.assert(cpu.memory.read(0x1000) === 2);
  t.assert(cpu.cycles === (3 * 4));
});
instructionTest(0x35, 'DEC_mHL', { 0x1000: 1 }, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1000;
  cpu.execute(opcode);
  t.assert(cpu.memory.read(0x1000) === 0);
  t.assert(cpu.cycles === (3 * 4));
});
instructionTest(0x36, 'LD_mHL_n', { 0: 0xaa }, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1000;
  cpu.execute(opcode);
  t.assert(cpu.memory.read(0x1000) === 0xaa);
  t.assert(cpu.cycles === (3 * 4));
});
instructionTest(0x37, 'SCF', {}, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.registers.f = Flags.Zero | Flags.HalfCarry | Flags.Operation;
  cpu.execute(opcode);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
jumpRelativeIfFlag(0x38, 'JR_C_n', Flags.Carry);
addReg16Reg16(0x39, 'ADD_HL_SP', 'hl', 'sp');
instructionTest(0x3A, 'LD_A_mHLm', { 0x1000: 0xaa }, (t, opcode, cpu, memory) => {
  cpu.registers.hl = 0x1000;

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x0fff);
  t.assert(cpu.registers.a === 0xaa);
  t.assert(cpu.cycles === (2 * 4));
});
decReg16Test(0x3B, 'DEC_SP', 'sp');
incReg8Test(0x3C, 'INC_A', 'a');
decReg8Test(0x3D, 'DEC_A', 'a');
loadReg8ImmTest(0x3E, 'LD_A_n', 'a');
instructionTest(0x3F, 'CCF', {}, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.execute(opcode);
  t.assert(cpu.registers.f === 0);

  cpu.registers.f = Flags.HalfCarry | Flags.Operation | Flags.Zero;
  cpu.execute(opcode);
  t.assert(cpu.registers.f === (
    Flags.HalfCarry | Flags.Operation | Flags.Zero | Flags.Carry
  ));

  cpu.execute(opcode);
  t.assert(cpu.registers.f === (
    Flags.HalfCarry | Flags.Operation | Flags.Zero
  ));
});
loadReg8Reg8(0x40, 'LD_B_B', 'b', 'b');
loadReg8Reg8(0x41, 'LD_B_C', 'b', 'c');
loadReg8Reg8(0x42, 'LD_B_D', 'b', 'd');
loadReg8Reg8(0x43, 'LD_B_E', 'b', 'e');
loadReg8Reg8(0x44, 'LD_B_H', 'b', 'h');
loadReg8Reg8(0x45, 'LD_B_L', 'b', 'l');
loadReg8HLPtr(0x46, 'LD_B_mHL', 'b');
loadReg8Reg8(0x47, 'LD_B_A', 'b', 'a');
loadReg8Reg8(0x48, 'LD_C_B', 'c', 'b');
loadReg8Reg8(0x49, 'LD_C_C', 'c', 'c');
loadReg8Reg8(0x4A, 'LD_C_D', 'c', 'd');
loadReg8Reg8(0x4B, 'LD_C_E', 'c', 'e');
loadReg8Reg8(0x4C, 'LD_C_H', 'c', 'h');
loadReg8Reg8(0x4D, 'LD_C_L', 'c', 'l');
loadReg8HLPtr(0x4E, 'LD_C_mHL', 'c');
loadReg8Reg8(0x4F, 'LD_C_A', 'c', 'a');
loadReg8Reg8(0x50, 'LD_D_B', 'd', 'b');
loadReg8Reg8(0x51, 'LD_D_C', 'd', 'c');
loadReg8Reg8(0x52, 'LD_D_D', 'd', 'd');
loadReg8Reg8(0x53, 'LD_D_E', 'd', 'e');
loadReg8Reg8(0x54, 'LD_D_H', 'd', 'h');
loadReg8Reg8(0x55, 'LD_D_L', 'd', 'l');
loadReg8HLPtr(0x56, 'LD_D_mHL', 'd');
loadReg8Reg8(0x57, 'LD_D_A', 'd', 'a');
loadReg8Reg8(0x58, 'LD_E_B', 'e', 'b');
loadReg8Reg8(0x59, 'LD_E_C', 'e', 'c');
loadReg8Reg8(0x5A, 'LD_E_D', 'e', 'd');
loadReg8Reg8(0x5B, 'LD_E_E', 'e', 'e');
loadReg8Reg8(0x5C, 'LD_E_H', 'e', 'h');
loadReg8Reg8(0x5D, 'LD_E_L', 'e', 'l');
loadReg8HLPtr(0x5E, 'LD_E_mHL', 'e');
loadReg8Reg8(0x5F, 'LD_E_A', 'e', 'a');
loadReg8Reg8(0x60, 'LD_H_B', 'h', 'b');
loadReg8Reg8(0x61, 'LD_H_C', 'h', 'c');
loadReg8Reg8(0x62, 'LD_H_D', 'h', 'd');
loadReg8Reg8(0x63, 'LD_H_E', 'h', 'e');
loadReg8Reg8(0x64, 'LD_H_H', 'h', 'h');
loadReg8Reg8(0x65, 'LD_H_L', 'h', 'l');
loadReg8HLPtr(0x66, 'LD_H_mHL', 'h');
loadReg8Reg8(0x67, 'LD_H_A', 'h', 'a');
loadReg8Reg8(0x68, 'LD_L_B', 'l', 'b');
loadReg8Reg8(0x69, 'LD_L_C', 'l', 'c');
loadReg8Reg8(0x6A, 'LD_L_D', 'l', 'd');
loadReg8Reg8(0x6B, 'LD_L_E', 'l', 'e');
loadReg8Reg8(0x6C, 'LD_L_H', 'l', 'h');
loadReg8Reg8(0x6D, 'LD_L_L', 'l', 'l');
loadReg8HLPtr(0x6E, 'LD_L_mHL', 'l');
loadReg8Reg8(0x6F, 'LD_L_A', 'l', 'a');
loadHLPtrReg(0x70, 'LD_mHL_B', 'b');
loadHLPtrReg(0x71, 'LD_mHL_C', 'c');
loadHLPtrReg(0x72, 'LD_mHL_D', 'd');
loadHLPtrReg(0x73, 'LD_mHL_E', 'e');
instructionTest(0x74, 'LD_mHL_H', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0xaabb;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.memory.read(0xaabb) === 0xaa);
  t.assert(cpu.cycles === (2 * 4));
});
instructionTest(0x75, 'LD_mHL_L', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0xaabb;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.memory.read(0xaabb) === 0xbb);
  t.assert(cpu.cycles === (2 * 4));
});
instructionTest(0x76, 'HALT', {}, (t, opcode, cpu) => {
  t.assert(!cpu.isHalted);
  cpu.execute(opcode);
  t.assert(cpu.isHalted);
  t.assert(cpu.cycles === (1 * 4));
});
loadHLPtrReg(0x77, 'LD_mHL_A', 'a');
loadReg8Reg8(0x78, 'LD_A_B', 'a', 'b');
loadReg8Reg8(0x79, 'LD_A_C', 'a', 'c');
loadReg8Reg8(0x7A, 'LD_A_D', 'a', 'd');
loadReg8Reg8(0x7B, 'LD_A_E', 'a', 'e');
loadReg8Reg8(0x7C, 'LD_A_H', 'a', 'h');
loadReg8Reg8(0x7D, 'LD_A_L', 'a', 'l');
loadReg8HLPtr(0x7E, 'LD_A_mHL', 'a');
loadReg8Reg8(0x7F, 'LD_A_A', 'a', 'a');
addAReg8(0x80, 'ADD_A_B', 'b');
addAReg8(0x81, 'ADD_A_C', 'c');
addAReg8(0x82, 'ADD_A_D', 'd');
addAReg8(0x83, 'ADD_A_E', 'e');
addAReg8(0x84, 'ADD_A_H', 'h');
addAReg8(0x85, 'ADD_A_L', 'l');
instructionTest(0x86, 'ADD_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1000;

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x01;
  cpu.memory.write(cpu.registers.hl, 0x0f);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x01;
  cpu.memory.write(cpu.registers.hl, 0xff);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
instructionTest(0x87, 'ADD_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x01;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x02);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x08;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x80;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
adcAReg8(0x88, 'ADC_A_B', 'b');
adcAReg8(0x89, 'ADC_A_C', 'c');
adcAReg8(0x8A, 'ADC_A_D', 'd');
adcAReg8(0x8B, 'ADC_A_E', 'e');
adcAReg8(0x8C, 'ADC_A_H', 'h');
adcAReg8(0x8D, 'ADC_A_L', 'l');
instructionTest(0x8E, 'ADC_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1000;

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x01;
  cpu.memory.write(cpu.registers.hl, 0x0e);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x01;
  cpu.memory.write(cpu.registers.hl, 0xfe);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
instructionTest(0x8F, 'ADC_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x01;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x03);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x08;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x11);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x80;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === Flags.Carry);
});
subAReg8(0x90, 'SUB_A_B', 'b');
subAReg8(0x91, 'SUB_A_C', 'c');
subAReg8(0x92, 'SUB_A_D', 'd');
subAReg8(0x93, 'SUB_A_E', 'e');
subAReg8(0x94, 'SUB_A_H', 'h');
subAReg8(0x95, 'SUB_A_L', 'l');
instructionTest(0x96, 'SUB_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.memory.write(cpu.registers.hl, 0x0f);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
instructionTest(0x97, 'SUB_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x01;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);
});
sbcAReg8(0x98, 'SBC_A_B', 'b');
sbcAReg8(0x99, 'SBC_A_C', 'c');
sbcAReg8(0x9A, 'SBC_A_D', 'd');
sbcAReg8(0x9B, 'SBC_A_E', 'e');
sbcAReg8(0x9C, 'SBC_A_H', 'h');
sbcAReg8(0x9D, 'SBC_A_L', 'l');
instructionTest(0x9E, 'SUB_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.memory.write(cpu.registers.hl, 0x0e);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
instructionTest(0x9F, 'SBC_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));

  cpu.registers.a = 0xaa;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
andAReg8(0xA0, 'AND_A_B', 'b');
andAReg8(0xA1, 'AND_A_C', 'c');
andAReg8(0xA2, 'AND_A_D', 'd');
andAReg8(0xA3, 'AND_A_E', 'e');
andAReg8(0xA4, 'AND_A_H', 'h');
andAReg8(0xA5, 'AND_A_L', 'l');
instructionTest(0xA6, 'AND_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

  cpu.registers.a = 0b11001100;
  cpu.memory.write(cpu.registers.hl, 0b10111011);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b10001000);
  t.assert(cpu.registers.f === Flags.HalfCarry);
});
instructionTest(0xA7, 'AND_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

  cpu.registers.a = 0x10;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);
});
xorAReg8(0xA8, 'XOR_A_B', 'b');
xorAReg8(0xA9, 'XOR_A_C', 'c');
xorAReg8(0xAA, 'XOR_A_D', 'd');
xorAReg8(0xAB, 'XOR_A_E', 'e');
xorAReg8(0xAC, 'XOR_A_H', 'h');
xorAReg8(0xAD, 'XOR_A_L', 'l');
instructionTest(0xAE, 'XOR_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a =    0b11001100;
  cpu.memory.write(cpu.registers.hl, 0b10111011);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01110111);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0xff;
  cpu.memory.write(cpu.registers.hl, 0xff);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);
});
instructionTest(0xAF, 'XOR_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0xaa;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);
});
orAReg8(0xB0, 'OR_A_B', 'b');
orAReg8(0xB1, 'OR_A_C', 'c');
orAReg8(0xB2, 'OR_A_D', 'd');
orAReg8(0xB3, 'OR_A_E', 'e');
orAReg8(0xB4, 'OR_A_H', 'h');
orAReg8(0xB5, 'OR_A_L', 'l');
instructionTest(0xB6, 'OR_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a =    0b11001100;
  cpu.memory.write(cpu.registers.hl, 0b10011011);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b11011111);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0xff;
  cpu.memory.write(cpu.registers.hl, 0xff);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === Flags.HalfCarry);
});
instructionTest(0xB7, 'OR_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x10;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === 0);
});
cpAReg8(0xB8, 'CP_A_B', 'b');
cpAReg8(0xB9, 'CP_A_C', 'c');
cpAReg8(0xBA, 'CP_A_D', 'd');
cpAReg8(0xBB, 'CP_A_E', 'e');
cpAReg8(0xBC, 'CP_A_H', 'h');
cpAReg8(0xBD, 'CP_A_L', 'l');
instructionTest(0xBE, 'CP_A_mHL', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x02);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.memory.write(cpu.registers.hl, 0x0f);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x1f);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.memory.write(cpu.registers.hl, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
instructionTest(0xBF, 'CP_A_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x01;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === Flags.Zero);
});
retIfNotFlag(0xC0, 'RET_NZ', Flags.Zero);
popReg(0xC1, 'POP_BC', 'bc');
jumpIfNotFlag(0xC2, 'JP_NZ_nn', Flags.Zero);
instructionTest(0xC3, 'JP_nn', { 0: 0x34, 1: 0x12 }, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.registers.pc === 0x1234);
});
callIfNotFlag(0xC4, 'CALL_NZ_nn', Flags.Zero);
pushReg(0xC5, 'PUSH_BC', 'bc');
instructionTest(0xC6, 'ADD_A_n', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.memory.write(0, 0x00);
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.memory.write(1, 0x01);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x01;
  cpu.memory.write(2, 0x0f);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x01;
  cpu.memory.write(3, 0xff);
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
rst(0xC7, 'RST_00h', 0x00);
retIfFlag(0xC8, 'RET_Z', Flags.Zero);
instructionTest(0xC9, 'RET', { 0xfffd: 0x34, 0xfffe: 0x12 }, (t, opcode, cpu) => {
  cpu.registers.sp = 0xfffd;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.registers.pc === 0x1234);
  t.assert(cpu.registers.sp === 0xffff);
});
jumpIfFlag(0xCA, 'JP_Z_nn', Flags.Zero);
instructionTest(0xCB, 'CB', {}, t => t.pass('Tested in dedicated file.'));
callIfFlag(0xCC, 'CALL_Z_nn', Flags.Zero);
instructionTest(0xCD, 'CALL', { 0: 0x34, 1: 0x12 }, (t, opcode, cpu) => {
  cpu.registers.sp = 0xffff;

  cpu.execute(opcode);
  t.assert(cpu.cycles === (6 * 4));
  t.assert(cpu.registers.pc === 0x1234);
  t.assert(cpu.registers.sp === 0xfffd);
});
instructionTest(0xCE, 'ADC_A_n', { 0: 0, 1: 0, 2: 0x0f, 3: 0xfe }, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x01;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x01;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));
});
rst(0xCF, 'RST_08h', 0x08);
retIfNotFlag(0xD0, 'RET_NC', Flags.Carry);
popReg(0xD1, 'POP_DE', 'de');
jumpIfNotFlag(0xD2, 'JP_NC_nn', Flags.Carry);
XX(0xD3, 'XX0');
callIfNotFlag(0xD4, 'CALL_NC_nn', Flags.Carry);
pushReg(0xD5, 'PUSH_DE', 'de');
instructionTest(0xD6, 'SUB_A_n', { 0: 0x00, 1: 0x01, 2: 0x0f, 3: 0x01 }, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
rst(0xD7, 'RST_10h', 0x10);
retIfFlag(0xD8, 'RET_C', Flags.Carry);
instructionTest(0xD9, 'RETI', { 0xfffd: 0x34, 0xfffe: 0x12 }, (t, opcode, cpu) => {
  cpu.registers.sp = 0xfffd;
  cpu.IME = false;

  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.registers.pc === 0x1234);
  t.assert(cpu.registers.sp === 0xffff);
  t.assert(cpu.IME);
});
jumpIfFlag(0xDA, 'JP_C_nn', Flags.Carry);
XX(0xDB, 'XX1');
callIfFlag(0xDC, 'CALL_C_nn', Flags.Carry);
XX(0xDD, 'XX2');
instructionTest(0xDE, 'SBC_A_n', { 0: 0x00, 1: 0x00, 2: 0x0e, 3: 0x00}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x10);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.registers.f = Flags.Carry;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
rst(0xDF, 'RST_18h', 0x18);

instructionTest(0xE0, 'LD_mFFn_A', { 0: 0xaa }, (t, opcode, cpu) => {
  cpu.registers.a = 0xbb;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (3 * 4));
  t.assert(cpu.memory.read(0xffaa) === 0xbb);
});
popReg(0xE1, 'POP_HL', 'hl');
instructionTest(0xE2, 'LD_mFFC_A', {}, (t, opcode, cpu) => {
  cpu.registers.a = 0xbb;
  cpu.registers.c = 0xaa;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.memory.read(0xffaa) === 0xbb);
});
XX(0xE3, 'XX3');
XX(0xE4, 'XX4');
pushReg(0xE5,  'PUSH_HL', 'hl');
instructionTest(0xE6, 'AND_A_n', {0: 0x00, 1: 0x01, 2: 0b10111011}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

  cpu.registers.a = 0b11001100;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b10001000);
  t.assert(cpu.registers.f === Flags.HalfCarry);
});
rst(0xE7, 'RST_20h', 0x20);
instructionTest(0xE8, 'ADD_SP_n', {0: 0x01, 1: 0xff, 2: 0x80, 3: 0x01}, (t, opcode, cpu) => {
  cpu.registers.sp = 0x1234;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.registers.sp === 0x1235);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.execute(opcode);
  t.assert(cpu.registers.sp === 0x1234);
  t.assert(cpu.registers.f === (Flags.HalfCarry | Flags.Carry));

  cpu.execute(opcode);
  t.assert(cpu.registers.sp === 0x11b4);
  t.assert(cpu.registers.f === (Flags.HalfCarry | Flags.Carry));

  cpu.registers.sp = 0xffff;
  cpu.execute(opcode);
  t.assert(cpu.registers.sp === 0x0000);
  t.assert(cpu.registers.f === Flags.Carry);
});
instructionTest(0xE9, 'JP_HL', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1234;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.registers.pc === 0x1234);
});
instructionTest(0xEA, 'LD_mnn_A', {0: 0x34, 1: 0x12}, (t, opcode, cpu) => {
  cpu.registers.a = 0xaa;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.memory.read(0x1234) === 0xaa);
});
XX(0xEB, 'XX5');
XX(0xEC, 'XX6');
XX(0xED, 'XX7');
instructionTest(0xEE, 'XOR_A_n', {0: 0x00, 1: 0x01, 2: 0b10111011, 3: 0xff}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a =    0b11001100;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b01110111);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0xff;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);
});
rst(0xEF, 'RST_28h', 0x28);

instructionTest(0xF0, 'LD_A_mFFn', { 0: 0xaa, 0xffaa: 0xbb }, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (3 * 4));
  t.assert(cpu.registers.a === 0xbb);
});
popReg(0xF1, 'POP_AF', 'af');
instructionTest(0xF2, 'LD_A_mFFC', {0xffaa: 0xbb}, (t, opcode, cpu) => {
  cpu.registers.c = 0xaa;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0xbb);
});
instructionTest(0xF3, 'DI', {}, (t, opcode, cpu) => {
  cpu.IME = true;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(!cpu.IME);
});
XX(0xF4, 'XX8');
pushReg(0xF5,  'PUSH_AF', 'af');
instructionTest(0xF6, 'OR_A_n', {0: 0x00, 1: 0x01, 2: 0b10011011, 3: 0xff}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x01);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a =    0b11001100;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0b11011111);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0xff;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0xff);
  t.assert(cpu.registers.f === 0);
});
rst(0xF7, 'RST_30h', 0x30);
instructionTest(0xF8, 'LD_HL_SPn', {0: 0, 1: 1, 2: 0xff, 3: 0x80, 4: 1}, (t, opcode, cpu) => {
  cpu.registers.sp = 0x1234;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (3 * 4));
  t.assert(cpu.registers.hl === 0x1234);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x1235);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x1233);
  t.assert(cpu.registers.f === (Flags.HalfCarry | Flags.Carry));

  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x11b4);
  t.assert(cpu.registers.f === (Flags.HalfCarry | Flags.Carry));

  cpu.registers.sp = 0xffff;
  cpu.execute(opcode);
  t.assert(cpu.registers.hl === 0x0000);
  t.assert(cpu.registers.f === Flags.Carry);
});
instructionTest(0xF9, 'LD_SP_HL', {}, (t, opcode, cpu) => {
  cpu.registers.hl = 0x1234;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.sp === 0x1234);
});
instructionTest(0xFA, 'LD_A_mnn', {0: 0x34, 1: 0x12, 0x1234: 0xaa}, (t, opcode, cpu) => {
  cpu.execute(opcode);
  t.assert(cpu.cycles === (4 * 4));
  t.assert(cpu.registers.a === 0xaa);
});
instructionTest(0xFB, 'EI', {}, (t, opcode, cpu) => {
  cpu.IME = false;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (1 * 4));
  t.assert(cpu.IME);
});
XX(0xFC, 'XX9');
XX(0xFD, 'XXA');
instructionTest(0xFE, 'CP_A_n', {0: 0x00, 1: 0x01, 2: 0x0f, 3: 0x01}, (t, opcode, cpu) => {
  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.cycles === (2 * 4));
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.registers.a = 0x02;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x02);
  t.assert(cpu.registers.f === 0);

  cpu.registers.a = 0x1f;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x1f);
  t.assert(cpu.registers.f === Flags.HalfCarry);

  cpu.registers.a = 0x00;
  cpu.execute(opcode);
  t.assert(cpu.registers.a === 0x00);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.HalfCarry));
});
rst(0xFF, 'RST_38h', 0x38);
