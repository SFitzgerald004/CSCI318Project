import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { relativeTime } from '../utils/relativeTime';

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-22T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than a minute ago', () => {
    const date = new Date('2026-04-22T11:59:30Z');
    expect(relativeTime(date)).toBe('just now');
  });

  it('returns minutes for less than an hour', () => {
    const date = new Date('2026-04-22T11:55:00Z');
    expect(relativeTime(date)).toMatch(/5 minutes? ago/);
  });

  it('returns hours for less than a day', () => {
    const date = new Date('2026-04-22T09:00:00Z');
    expect(relativeTime(date)).toMatch(/3 hours? ago/);
  });

  it('returns days for less than a week', () => {
    const date = new Date('2026-04-20T12:00:00Z');
    expect(relativeTime(date)).toMatch(/2 days? ago/);
  });

  it('returns absolute date for 7+ days ago', () => {
    const date = new Date('2026-04-10T12:00:00Z');
    expect(relativeTime(date)).toMatch(/Apr 10/);
  });

  it('accepts ISO string input', () => {
    expect(relativeTime('2026-04-22T11:55:00Z')).toMatch(/5 minutes? ago/);
  });

  it('handles null/undefined gracefully', () => {
    expect(relativeTime(null)).toBe('');
    expect(relativeTime(undefined)).toBe('');
  });
});
