import { Registers, IRegisters } from './registers';
import { IMemoryInterface } from '../memory-interface';
import { ops } from './ops';
import { toHexString } from '../utils';
import { Clock } from '../clock';

export enum Flags {
  Zero          = (1 << 7),
  Operation     = (1 << 6),
  HalfCarry     = (1 << 5),
  Carry         = (1 << 4),

  ZeroBit       = 7,
  OperationBit  = 6,
  HalfCarryBit  = 5,
  CarryBit      = 4,
};

export class SM83 {
  registers: IRegisters = new Registers();
  memory: IMemoryInterface;
  clock: Clock;

  IME: boolean = true; // TODO: Find initial value
  isHalted = false;
  isStopped = false;

  constructor(memory: IMemoryInterface, clock: Clock) {
    this.memory = memory;
    this.clock = clock;
  }

  execute(opcode: number) {
    return ops[opcode](this);
  }

  fetchDecodeExecute() {
    const opcode = this.memory.read(this.registers.pc++);
    this.execute(opcode);
  }

  printState() {
    const {a, b, c, d, e, h, l, f, sp, pc} = this.registers;
    console.log(`A=${toHexString(a, 2)}\tB=${toHexString(b, 2)}\tC=${toHexString(c, 2)}\tD=${toHexString(d, 2)}\t`);
    console.log(`E=${toHexString(e, 2)}\tH=${toHexString(h, 2)}\tL=${toHexString(l, 2)}\tF=${toHexString(f, 2)}\t`);
    console.log(`PC=${toHexString(pc)}\tSP=${toHexString(sp, 2)}`);
    console.log('----------------------------');
  }
};
