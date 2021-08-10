import { Registers, IRegisters } from './registers';
import { IMemoryInterface, MemoryInterface } from '../memory-interface';
import { ops } from './ops';
import { toHexString } from '../utils';
import { Clock } from '../clock';
import { Register8 } from '../memory-interface/register';
import { Input } from '../input';
import { Timer } from '../timer';

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

export enum InterruptAddress {
  IE = 0xFFFF,
  IF = 0xFF0F,
}

export enum InterruptType {
  VBlank,
  LCDSTAT,
  Timer,
  Serial,
  Joypad,
}

const interruptTable = [
  0x0040,
  0x0048,
  0x0050,
  0x0058,
  0x0060,
];

export class SM83 implements IMemoryInterface {
  registers: IRegisters = new Registers();
  memory: MemoryInterface;
  input: Input;
  timer: Timer;
  clock: Clock;

  isHalted = false;
  isStopped = false;

  IME: boolean = false;
  delayedIME: boolean = false;
  private IE = new Register8(0xff);
  private IF = new Register8(0x00);

  // If the CPU is halted while interrupts are disabled and there are no pending interrupts,
  /// program flow actually continues
  // However the program counter incremement is skipped for one instruction. If the instruction is
  // `inc a` (0x3C), then the increment is performed twice
  haltBugEffects: boolean = false;

  constructor(memory: MemoryInterface, input: Input, timer: Timer, clock: Clock) {
    this.memory = memory;
    this.input = input;
    this.timer = timer;
    this.clock = clock;
  }

  requestInterrupt(value: InterruptType) {
    this.IF.setBit(value);
  }

  // TODO: Throw if a read or write is directed to a device without a
  // corresponding address
  read(address: number) {
    if (address === InterruptAddress.IE) return this.IE.value;
    if (address === InterruptAddress.IF) return this.IF.value;
    return 0xff;
  }

  write(address: number, value: number) {
    if (address === InterruptAddress.IE) { this.IE.value = value; return; }
    if (address === InterruptAddress.IF) { this.IF.value = value; return; }
  }

  private handleInterrupt() {
    // Find the highest priority interrupt, if there is one
    for (let i = 0; i <= interruptTable.length; i++) {
      // The interrupt should be requested AND enabled
      if (this.IF.bit(i) && this.IE.bit(i)) {
        // We've found a usable interrupt, prevent more from occurring
        this.IME = false;
        // this.delayedIME = false;
        this.IF.clearBit(i);

        // Push the current PC to the stack
        this.registers.sp--;
        this.memory.write(this.registers.sp--, this.registers.pc >> 8);
        this.memory.write(this.registers.sp, this.registers.pc & 0xff);

        // Jump to the corresponding interrupt handler address
        this.registers.pc = interruptTable[i];

        // Pandocs state this should take 5 cycles
        this.clock.cycles += 5;

        return;
      }
    }
  }

  interruptIsPending() {
    return Boolean(this.IF.value & this.IE.value);
  }

  execute(opcode: number) {
    return ops[opcode](this);
  }

  fetchDecodeExecute() {
    const enabledInterruptRequested = this.interruptIsPending();
    if (this.isHalted && !this.IME && enabledInterruptRequested) {
      this.isHalted = false;
    }

    if (this.IME && enabledInterruptRequested) {
      this.isHalted = false;
      this.handleInterrupt();
    } else {
      this.IME = this.delayedIME;
    }

    if (!this.isHalted) {
      const opcode = this.memory.read(this.registers.pc);

      if (this.haltBugEffects) {
        this.haltBugEffects = false;
        // When the instruction is `inc a` (0x3C), the instruction is run twice
        if (opcode === 0x3C) {
          this.execute(opcode);
        }
      } else {
        this.registers.pc++;
      }

      this.execute(opcode);
    } else {
      // Continue to advance the clock when halted
      // TODO: This seems right, but it's a guess
      this.clock.cycles++;
    }
  }

  printState() {
    const {a, b, c, d, e, h, l, f, sp, pc} = this.registers;
    console.log(`A=${toHexString(a, 2)}\tB=${toHexString(b, 2)}\tC=${toHexString(c, 2)}\tD=${toHexString(d, 2)}\t`);
    console.log(`E=${toHexString(e, 2)}\tH=${toHexString(h, 2)}\tL=${toHexString(l, 2)}\tF=${toHexString(f, 2)}\t`);
    console.log(`PC=${toHexString(pc)}\tSP=${toHexString(sp, 2)}`);
    console.log('----------------------------');
  }
};
