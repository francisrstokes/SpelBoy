import { Registers, IRegisters } from './registers';
import { IMemoryInterface } from '../memory-interface';
import { ops } from './ops';

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
  cycles: number = 0;

  IME: boolean = true; // TODO: Find initial value
  isHalted = false;
  isStopped = false;

  constructor(memory: IMemoryInterface) {
    this.memory = memory;
  }

  cycleMachine(times: number) {
    this.cycles += times;
  }

  execute(opcode: number) {
    return ops[opcode](this);
  }

  fetchDecodeExecute() {
    const opcode = this.memory.read(this.registers.pc++);
    return this.execute(opcode);
  }
};
