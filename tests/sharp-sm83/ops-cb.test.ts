import { IMemoryInterface } from '../../src/memory-interface/index';
import test from 'tape';
import {createMockMemory, RegName} from './utils';
import { SM83, Flags} from '../../src/sharp-sm83/index';
import { Clock } from '../../src/clock';

const HL_ADDR = 0x1234;

const generateCBOpcodeMemory = (opcode: number, numCalls: number) => (
  Array.from({length: numCalls}, () => opcode).reduce<Record<number, number>>((acc, cur, i) => {
    acc[i] = cur;
    return acc;
  }, {})
);

type InstructionTestCb = (t: test.Test, opcode: number, cpu: SM83, memory: IMemoryInterface) => void;
const cbTest = (opcode: number, name: string, mValues: Record<number, number>, cb: InstructionTestCb) => {
  test(`CB Prefix: 0x${opcode.toString(16).padStart(2, '0')} [${name}]`, t => {
    const memory = createMockMemory(mValues);
    const cpu = new SM83(memory, new Clock());
    cb(t, opcode, cpu, memory);
    t.end();
  });
};

const rlc = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 3), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b01010101);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0b0001000;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);
  });
};

const rrc = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 4), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b01010101);
    t.assert(cpu.registers.f === 0);
    t.assert(cpu.clock.cycles === (2 * 4));

    cpu.registers[reg] = 0b00001000;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b00000100);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b00000001;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b10000000);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);
  });
};

const rl = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 5), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b01010100);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0b0001000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010001);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b0001000;
    cpu.registers.f = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers[reg] = 0;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 1);
    t.assert(cpu.registers.f === 0);
  });
};

const rr = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 6), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b01010101);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b00001000;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b00000100);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b00001000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b10000100);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b00000001;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b00000000);
    t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));

    cpu.registers[reg] = 0;
    cpu.registers.f = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers[reg] = 0;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0x80);
    t.assert(cpu.registers.f === 0);
  });
};

const sla = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 5), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b01010100);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b10101000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0b0001000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers[reg] = 0;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);
  });
};

const sra = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 5), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b11010101);
    t.assert(cpu.registers.f === 0);

    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b11101010);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0b0100000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers[reg] = 0b10000000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b11000000);
    t.assert(cpu.registers.f === 0);
  });
};

const srl = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 5), (t, _, cpu) => {
    cpu.registers[reg] = 0b10101010;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0b01010101);
    t.assert(cpu.registers.f === 0);

    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b00101010);
    t.assert(cpu.registers.f === Flags.Carry);

    cpu.registers[reg] = 0b0100000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b0010000);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);

    cpu.registers[reg] = 0b10000000;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0b01000000);
    t.assert(cpu.registers.f === 0);
  });
};

const swap = (opcode: number, name: string, reg: RegName) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 5), (t, _, cpu) => {
    cpu.registers[reg] = 0xab;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === 0xba);
    t.assert(cpu.registers.f === 0);

    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0xab);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0xff);
    t.assert(cpu.registers.f === 0);

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
    t.assert(cpu.registers.f === Flags.Zero);
  });
};

const bit = (opcode: number, name: string, reg: RegName, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 3), (t, _, cpu) => {
    cpu.registers[reg] = ~(1 << index) & 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

    cpu.registers[reg] = 1 << index;
    cpu.execute(0xCB);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.registers[reg] = ~(1 << index) & 0xff;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry | Flags.Carry));
  });
};

const bitmHL = (opcode: number, name: string, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 3), (t, _, cpu) => {
    cpu.registers.hl = HL_ADDR;
    cpu.memory.write(HL_ADDR, ~(1 << index) & 0xff);
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (3 * 4));
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry));

    cpu.memory.write(HL_ADDR, 1 << index);
    cpu.execute(0xCB);
    t.assert(cpu.registers.f === Flags.HalfCarry);

    cpu.memory.write(HL_ADDR, ~(1 << index) & 0xff);
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers.f === (Flags.Zero | Flags.HalfCarry | Flags.Carry));
  });
};

const res = (opcode: number, name: string, reg: RegName, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 4), (t, _, cpu) => {
    cpu.registers[reg] = 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === (~(1 << index) & 0xff));

    cpu.registers[reg] = ~(1 << index) & 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === (~(1 << index) & 0xff));

    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);

    cpu.registers[reg] = 1 << index;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0);
  });
};

const resmHL = (opcode: number, name: string, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 4), (t, _, cpu) => {
    cpu.registers.hl = HL_ADDR;
    cpu.memory.write(HL_ADDR, 0xff);
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (4 * 4));
    t.assert(cpu.memory.read(HL_ADDR) === (~(1 << index) & 0xff));

    cpu.memory.write(HL_ADDR, ~(1 << index) & 0xff);
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === (~(1 << index) & 0xff));

    cpu.memory.write(HL_ADDR, 0);
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === 0);

    cpu.memory.write(HL_ADDR, 1 << index);
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === 0);
  });
};

const set = (opcode: number, name: string, reg: RegName, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 4), (t, _, cpu) => {
    cpu.registers[reg] = 0;
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (2 * 4));
    t.assert(cpu.registers[reg] === (1 << index));

    cpu.registers[reg] = ~(1 << index) & 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0xff);

    cpu.registers[reg] = 0xff;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === 0xff);

    cpu.registers[reg] = 1 << index;
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.registers[reg] === (1 << index));
  });
};

const setmHL = (opcode: number, name: string, index: number) => {
  return cbTest(opcode, name, generateCBOpcodeMemory(opcode, 4), (t, _, cpu) => {
    cpu.registers.hl = HL_ADDR;
    cpu.memory.write(HL_ADDR, 0);
    cpu.execute(0xCB);
    t.assert(cpu.clock.cycles === (4 * 4));
    t.assert(cpu.memory.read(HL_ADDR) === (1 << index));

    cpu.memory.write(HL_ADDR, ~(1 << index) & 0xff);
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === 0xff);

    cpu.memory.write(HL_ADDR, 0xff);
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === 0xff);

    cpu.memory.write(HL_ADDR, 1 << index);
    cpu.registers.f = Flags.Carry;
    cpu.execute(0xCB);
    t.assert(cpu.memory.read(HL_ADDR) === (1 << index));
  });
};

rlc(0x00, 'RLC_B', 'b');
rlc(0x01, 'RLC_C', 'c');
rlc(0x02, 'RLC_D', 'd');
rlc(0x03, 'RLC_E', 'e');
rlc(0x04, 'RLC_H', 'h');
rlc(0x05, 'RLC_L', 'l');
cbTest(0x06, 'RLC_mHL', generateCBOpcodeMemory(0x06, 3), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010101);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.memory.write(HL_ADDR, 0b0001000);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);
});
rlc(0x07, 'RLC_A', 'a');
rrc(0x08, 'RRC_B', 'b');
rrc(0x09, 'RRC_C', 'c');
rrc(0x0A, 'RRC_D', 'd');
rrc(0x0B, 'RRC_E', 'e');
rrc(0x0C, 'RRC_H', 'h');
rrc(0x0D, 'RRC_L', 'l');
cbTest(0x0E, 'RRC_mHL', generateCBOpcodeMemory(0x0E, 3), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010101);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b00001000);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b00000100);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b00000001);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b10000000);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);
});
rrc(0x0F, 'RRC_A', 'a');
rl(0x10, 'RL_B', 'b');
rl(0x11, 'RL_C', 'c');
rl(0x12, 'RL_D', 'd');
rl(0x13, 'RL_E', 'e');
rl(0x14, 'RL_H', 'h');
rl(0x15, 'RL_L', 'l');
cbTest(0x16, 'RL_mHL', generateCBOpcodeMemory(0x16, 5), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010100);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.memory.write(HL_ADDR, 0b0001000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010001);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b0001000);
  cpu.registers.f = 0;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.memory.write(HL_ADDR, 0);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 1);
  t.assert(cpu.registers.f === 0);
});
rl(0x17, 'RL_A', 'a');
rr(0x18, 'RR_B', 'b');
rr(0x19, 'RR_C', 'c');
rr(0x1A, 'RR_D', 'd');
rr(0x1B, 'RR_E', 'e');
rr(0x1C, 'RR_H', 'h');
rr(0x1D, 'RR_L', 'l');
cbTest(0x1E, 'RR_mHL', generateCBOpcodeMemory(0x1E, 6), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010101);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b00001000);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b00000100);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b00001000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b10000100);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b00000001);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b00000000);
  t.assert(cpu.registers.f === (Flags.Carry | Flags.Zero));

  cpu.memory.write(HL_ADDR, 0);
  cpu.registers.f = 0;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.memory.write(HL_ADDR, 0);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0x80);
  t.assert(cpu.registers.f === 0);
});
rr(0x1F, 'RR_A', 'a');
sla(0x20, 'SLA_B', 'b');
sla(0x21, 'SLA_C', 'c');
sla(0x22, 'SLA_D', 'd');
sla(0x23, 'SLA_E', 'e');
sla(0x24, 'SLA_H', 'h');
sla(0x25, 'SLA_L', 'l');
cbTest(0x26, 'SLA_mHL', generateCBOpcodeMemory(0x26, 5), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010100);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b10101000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0b0001000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.memory.write(HL_ADDR, 0);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);
});
sla(0x27, 'SLA_A', 'a');
sra(0x28, 'SRA_B', 'b');
sra(0x29, 'SRA_C', 'c');
sra(0x2A, 'SRA_D', 'd');
sra(0x2B, 'SRA_E', 'e');
sra(0x2C, 'SRA_H', 'h');
sra(0x2D, 'SRA_L', 'l');
cbTest(0x2E, 'SRA_mHL', generateCBOpcodeMemory(0x2E, 5), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b11010101);
  t.assert(cpu.registers.f === 0);

  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b11101010);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.memory.write(HL_ADDR, 0b0100000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.memory.write(HL_ADDR, 0b10000000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b11000000);
  t.assert(cpu.registers.f === 0);
});
sra(0x2F, 'SRA_A', 'a');
swap(0x30, 'SWAP_B', 'b');
swap(0x31, 'SWAP_C', 'c');
swap(0x32, 'SWAP_D', 'd');
swap(0x33, 'SWAP_E', 'e');
swap(0x34, 'SWAP_H', 'h');
swap(0x35, 'SWAP_L', 'l');
cbTest(0x36, 'SWAP_mHL', generateCBOpcodeMemory(0x36, 5), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0xab);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (4 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0xba);
  t.assert(cpu.registers.f === 0);

  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0xab);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0xff);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0xff);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);
});
swap(0x37, 'SWAP_A', 'a');
srl(0x38, 'SRL_B', 'b');
srl(0x39, 'SRL_C', 'c');
srl(0x3A, 'SRL_D', 'd');
srl(0x3B, 'SRL_E', 'e');
srl(0x3C, 'SRL_H', 'h');
srl(0x3D, 'SRL_L', 'l');
cbTest(0x3E, 'SRL_mHL', generateCBOpcodeMemory(0x3E, 5), (t, _, cpu) => {
  cpu.registers.hl = HL_ADDR;
  cpu.memory.write(HL_ADDR, 0b10101010);
  cpu.execute(0xCB);
  t.assert(cpu.clock.cycles === (2 * 4));
  t.assert(cpu.memory.read(HL_ADDR) === 0b01010101);
  t.assert(cpu.registers.f === 0);

  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b00101010);
  t.assert(cpu.registers.f === Flags.Carry);

  cpu.memory.write(HL_ADDR, 0b0100000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b0010000);
  t.assert(cpu.registers.f === 0);

  cpu.memory.write(HL_ADDR, 0);
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0);
  t.assert(cpu.registers.f === Flags.Zero);

  cpu.memory.write(HL_ADDR, 0b10000000);
  cpu.registers.f = Flags.Carry;
  cpu.execute(0xCB);
  t.assert(cpu.memory.read(HL_ADDR) === 0b01000000);
  t.assert(cpu.registers.f === 0);
});
srl(0x3F, 'SRL_A', 'a');
bit(0x40, 'BIT_0_B', 'b', 0);
bit(0x41, 'BIT_0_C', 'c', 0);
bit(0x42, 'BIT_0_D', 'd', 0);
bit(0x43, 'BIT_0_E', 'e', 0);
bit(0x44, 'BIT_0_H', 'h', 0);
bit(0x45, 'BIT_0_L', 'l', 0);
bitmHL(0x46, 'BIT_0_mHL', 0);
bit(0x47, 'BIT_0_A', 'a', 0);
bit(0x48, 'BIT_1_B', 'b', 1);
bit(0x49, 'BIT_1_C', 'c', 1);
bit(0x4A, 'BIT_1_D', 'd', 1);
bit(0x4B, 'BIT_1_E', 'e', 1);
bit(0x4C, 'BIT_1_H', 'h', 1);
bit(0x4D, 'BIT_1_L', 'l', 1);
bitmHL(0x4E, 'BIT_1_mHL', 1);
bit(0x4F, 'BIT_1_A', 'a', 1);
bit(0x50, 'BIT_2_B', 'b', 2);
bit(0x51, 'BIT_2_C', 'c', 2);
bit(0x52, 'BIT_2_D', 'd', 2);
bit(0x53, 'BIT_2_E', 'e', 2);
bit(0x54, 'BIT_2_H', 'h', 2);
bit(0x55, 'BIT_2_L', 'l', 2);
bitmHL(0x56, 'BIT_2_mHL', 2);
bit(0x57, 'BIT_2_A', 'a', 2);
bit(0x58, 'BIT_3_B', 'b', 3);
bit(0x59, 'BIT_3_C', 'c', 3);
bit(0x5A, 'BIT_3_D', 'd', 3);
bit(0x5B, 'BIT_3_E', 'e', 3);
bit(0x5C, 'BIT_3_H', 'h', 3);
bit(0x5D, 'BIT_3_L', 'l', 3);
bitmHL(0x5E, 'BIT_3_mHL', 3);
bit(0x5F, 'BIT_3_A', 'a', 3);
bit(0x60, 'BIT_4_B', 'b', 4);
bit(0x61, 'BIT_4_C', 'c', 4);
bit(0x62, 'BIT_4_D', 'd', 4);
bit(0x63, 'BIT_4_E', 'e', 4);
bit(0x64, 'BIT_4_H', 'h', 4);
bit(0x65, 'BIT_4_L', 'l', 4);
bitmHL(0x66, 'BIT_4_mHL', 4);
bit(0x67, 'BIT_4_A', 'a', 4);
bit(0x68, 'BIT_5_B', 'b', 5);
bit(0x69, 'BIT_5_C', 'c', 5);
bit(0x6A, 'BIT_5_D', 'd', 5);
bit(0x6B, 'BIT_5_E', 'e', 5);
bit(0x6C, 'BIT_5_H', 'h', 5);
bit(0x6D, 'BIT_5_L', 'l', 5);
bitmHL(0x6E, 'BIT_5_mHL', 5);
bit(0x6F, 'BIT_5_A', 'a', 5);
bit(0x70, 'BIT_6_B', 'b', 6);
bit(0x71, 'BIT_6_C', 'c', 6);
bit(0x72, 'BIT_6_D', 'd', 6);
bit(0x73, 'BIT_6_E', 'e', 6);
bit(0x74, 'BIT_6_H', 'h', 6);
bit(0x75, 'BIT_6_L', 'l', 6);
bitmHL(0x76, 'BIT_6_mHL', 6);
bit(0x77, 'BIT_6_A', 'a', 6);
bit(0x78, 'BIT_7_B', 'b', 7);
bit(0x79, 'BIT_7_C', 'c', 7);
bit(0x7A, 'BIT_7_D', 'd', 7);
bit(0x7B, 'BIT_7_E', 'e', 7);
bit(0x7C, 'BIT_7_H', 'h', 7);
bit(0x7D, 'BIT_7_L', 'l', 7);
bitmHL(0x7E, 'BIT_7_mHL', 7);
bit(0x7F, 'BIT_7_A', 'a', 7);
res(0x80, 'RES_B_0', 'b', 0);
res(0x81, 'RES_C_0', 'c', 0);
res(0x82, 'RES_D_0', 'd', 0);
res(0x83, 'RES_E_0', 'e', 0);
res(0x84, 'RES_h_0', 'h', 0);
res(0x85, 'RES_L_0', 'l', 0);
resmHL(0x86, 'RES_mHL_0', 0);
res(0x87, 'RES_A_0', 'a', 0);
res(0x88, 'RES_B_1', 'b', 1);
res(0x89, 'RES_C_1', 'c', 1);
res(0x8A, 'RES_D_1', 'd', 1);
res(0x8B, 'RES_E_1', 'e', 1);
res(0x8C, 'RES_h_1', 'h', 1);
res(0x8D, 'RES_L_1', 'l', 1);
resmHL(0x8E, 'RES_mHL_1', 1);
res(0x8F, 'RES_A_1', 'a', 1);
res(0x90, 'RES_B_2', 'b', 2);
res(0x91, 'RES_C_2', 'c', 2);
res(0x92, 'RES_D_2', 'd', 2);
res(0x93, 'RES_E_2', 'e', 2);
res(0x94, 'RES_h_2', 'h', 2);
res(0x95, 'RES_L_2', 'l', 2);
resmHL(0x96, 'RES_mHL_2', 2);
res(0x97, 'RES_A_2', 'a', 2);
res(0x98, 'RES_B_3', 'b', 3);
res(0x99, 'RES_C_3', 'c', 3);
res(0x9A, 'RES_D_3', 'd', 3);
res(0x9B, 'RES_E_3', 'e', 3);
res(0x9C, 'RES_h_3', 'h', 3);
res(0x9D, 'RES_L_3', 'l', 3);
resmHL(0x9E, 'RES_mHL_3', 3);
res(0x9F, 'RES_A_3', 'a', 3);
res(0xA0, 'RES_B_4', 'b', 4);
res(0xA1, 'RES_C_4', 'c', 4);
res(0xA2, 'RES_D_4', 'd', 4);
res(0xA3, 'RES_E_4', 'e', 4);
res(0xA4, 'RES_h_4', 'h', 4);
res(0xA5, 'RES_L_4', 'l', 4);
resmHL(0xA6, 'RES_mHL_4', 4);
res(0xA7, 'RES_A_4', 'a', 4);
res(0xA8, 'RES_B_5', 'b', 5);
res(0xA9, 'RES_C_5', 'c', 5);
res(0xAA, 'RES_D_5', 'd', 5);
res(0xAB, 'RES_E_5', 'e', 5);
res(0xAC, 'RES_h_5', 'h', 5);
res(0xAD, 'RES_L_5', 'l', 5);
resmHL(0xAE, 'RES_mHL_5', 5);
res(0xAF, 'RES_A_5', 'a', 5);
res(0xB0, 'RES_B_6', 'b', 6);
res(0xB1, 'RES_C_6', 'c', 6);
res(0xB2, 'RES_D_6', 'd', 6);
res(0xB3, 'RES_E_6', 'e', 6);
res(0xB4, 'RES_h_6', 'h', 6);
res(0xB5, 'RES_L_6', 'l', 6);
resmHL(0xB6, 'RES_mHL_6', 6);
res(0xB7, 'RES_A_6', 'a', 6);
res(0xB8, 'RES_B_7', 'b', 7);
res(0xB9, 'RES_C_7', 'c', 7);
res(0xBA, 'RES_D_7', 'd', 7);
res(0xBB, 'RES_E_7', 'e', 7);
res(0xBC, 'RES_h_7', 'h', 7);
res(0xBD, 'RES_L_7', 'l', 7);
resmHL(0xBE, 'RES_mHL_7', 7);
res(0xBF, 'RES_A_7', 'a', 7);
set(0xC0, 'SET_B_0', 'b', 0);
set(0xC1, 'SET_C_0', 'c', 0);
set(0xC2, 'SET_D_0', 'd', 0);
set(0xC3, 'SET_E_0', 'e', 0);
set(0xC4, 'SET_h_0', 'h', 0);
set(0xC5, 'SET_L_0', 'l', 0);
setmHL(0xC6, 'SET_mHL_0', 0);
set(0xC7, 'SET_A_0', 'a', 0);
set(0xC8, 'SET_B_1', 'b', 1);
set(0xC9, 'SET_C_1', 'c', 1);
set(0xCA, 'SET_D_1', 'd', 1);
set(0xCB, 'SET_E_1', 'e', 1);
set(0xCC, 'SET_h_1', 'h', 1);
set(0xCD, 'SET_L_1', 'l', 1);
setmHL(0xCE, 'SET_mHL_1', 1);
set(0xCF, 'SET_A_1', 'a', 1);
set(0xD0, 'SET_B_2', 'b', 2);
set(0xD1, 'SET_C_2', 'c', 2);
set(0xD2, 'SET_D_2', 'd', 2);
set(0xD3, 'SET_E_2', 'e', 2);
set(0xD4, 'SET_h_2', 'h', 2);
set(0xD5, 'SET_L_2', 'l', 2);
setmHL(0xD6, 'SET_mHL_2', 2);
set(0xD7, 'SET_A_2', 'a', 2);
set(0xD8, 'SET_B_3', 'b', 3);
set(0xD9, 'SET_C_3', 'c', 3);
set(0xDA, 'SET_D_3', 'd', 3);
set(0xDB, 'SET_E_3', 'e', 3);
set(0xDC, 'SET_h_3', 'h', 3);
set(0xDD, 'SET_L_3', 'l', 3);
setmHL(0xDE, 'SET_mHL_3', 3);
set(0xDF, 'SET_A_3', 'a', 3);
set(0xE0, 'SET_B_4', 'b', 4);
set(0xE1, 'SET_C_4', 'c', 4);
set(0xE2, 'SET_D_4', 'd', 4);
set(0xE3, 'SET_E_4', 'e', 4);
set(0xE4, 'SET_h_4', 'h', 4);
set(0xE5, 'SET_L_4', 'l', 4);
setmHL(0xE6, 'SET_mHL_4', 4);
set(0xE7, 'SET_A_4', 'a', 4);
set(0xE8, 'SET_B_5', 'b', 5);
set(0xE9, 'SET_C_5', 'c', 5);
set(0xEA, 'SET_D_5', 'd', 5);
set(0xEB, 'SET_E_5', 'e', 5);
set(0xEC, 'SET_h_5', 'h', 5);
set(0xED, 'SET_L_5', 'l', 5);
setmHL(0xEE, 'SET_mHL_5', 5);
set(0xEF, 'SET_A_5', 'a', 5);
set(0xF0, 'SET_B_6', 'b', 6);
set(0xF1, 'SET_C_6', 'c', 6);
set(0xF2, 'SET_D_6', 'd', 6);
set(0xF3, 'SET_E_6', 'e', 6);
set(0xF4, 'SET_h_6', 'h', 6);
set(0xF5, 'SET_L_6', 'l', 6);
setmHL(0xF6, 'SET_mHL_6', 6);
set(0xF7, 'SET_A_6', 'a', 6);
set(0xF8, 'SET_B_7', 'b', 7);
set(0xF9, 'SET_C_7', 'c', 7);
set(0xFA, 'SET_D_7', 'd', 7);
set(0xFB, 'SET_E_7', 'e', 7);
set(0xFC, 'SET_h_7', 'h', 7);
set(0xFD, 'SET_L_7', 'l', 7);
setmHL(0xFE, 'SET_mHL_7', 7);
set(0xFF, 'SET_A_7', 'a', 7);
