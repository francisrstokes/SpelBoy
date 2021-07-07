import test from 'tape';
import { SM83 } from '../../src/sharp-sm83/index';
import { RegName, minimalMockMemory } from './utils';

const pairedRegisters: RegName[][] = [
  ['a', 'f', 'af'],
  ['b', 'c', 'bc'],
  ['d', 'e', 'de'],
  ['h', 'l', 'hl'],
];

test('Instaniation of SM83', t => {
  t.doesNotThrow(() => new SM83(minimalMockMemory));
  t.end();
});

test('Registers: 8-Bit', t => {
  const cpu = new SM83(minimalMockMemory);

  for (let [high, _, pair] of pairedRegisters) {
    cpu.registers[high] = 1;
    t.assert(cpu.registers[high] === 1, 'Basic set');
    t.assert(cpu.registers[pair] === 0x0100, 'Basic set (effect on 16-bit register)');

    cpu.registers[high] = -1;
    t.assert(cpu.registers[high] === 0xff, 'Negative -> Twos complement');
    t.assert(cpu.registers[pair] === 0xff00, 'Negative -> Twos complement (effect on 16-bit register)');

    cpu.registers[high]++;
    t.assert(cpu.registers[high] === 0, 'Overflow');

    cpu.registers[high]--;
    t.assert(cpu.registers[high] === 0xff, 'Underflow');
  }

  t.end();
});

test('Registers: 16-Bit', t => {
  const cpu = new SM83(minimalMockMemory);

  for (let [high, low, pair] of pairedRegisters) {
    cpu.registers[pair] = 1;
    t.assert(cpu.registers[pair] === 1, 'Basic set');
    t.assert(cpu.registers[high] === 0, 'Basic set (effect on 8-bit register)');
    t.assert(cpu.registers[low] === 1, 'Basic set (effect on 8-bit register)');

    cpu.registers[pair] = -1;
    t.assert(cpu.registers[pair] === 0xffff, 'Negative -> Twos complement');
    t.assert(cpu.registers[high] === 0xff, 'Negative -> Twos complement (effect on 8-bit register)');
    t.assert(cpu.registers[low] === 0xff, 'Negative -> Twos complement (effect on 8-bit register)');

    cpu.registers[pair]++;
    t.assert(cpu.registers[pair] === 0, 'Overflow');

    cpu.registers[pair]--;
    t.assert(cpu.registers[pair] === 0xffff, 'Underflow');
  }

  t.end();
});
