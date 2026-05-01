import { expect, test } from 'bun:test';
import * as templates from './templates/index.ts';

test('exports modern template', () => {
  expect(templates.modern).toBeDefined();
  expect(typeof templates.modern).toBe('function');
});
