import { describe, expect, it } from 'bun:test';
import { APP_NAME } from '../src/constants';

describe('shared', () => {
  it('exports APP_NAME', () => {
    expect(APP_NAME).toBe('Group Dynamics Simulator');
  });
});
