import { KeysOfType } from '../../src/utils';
import { IMemoryInterface } from '../../src/memory-interface/index';
import { IRegisters } from '../../src/sharp-sm83/registers';

export type RegName = KeysOfType<IRegisters, number>;

export const regs: Array<RegName> = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'l'];

export const minimalMockMemory: IMemoryInterface = {
  read: () => 0,
  write: () => {},
};

export const createMockMemory = (mockMemory: Record<number, number> = {}): IMemoryInterface => ({
  read: address => {
    return mockMemory[address] || 0
  },
  write: (address, value) => {
    mockMemory[address] = value;
  },
});
