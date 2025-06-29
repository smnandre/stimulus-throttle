import { describe, test, expect, vi } from 'vitest';
import { throttle } from '../src/stimulus-throttle';

vi.useFakeTimers();

describe('throttle', () => {
  test('throttles a function with leading and trailing calls', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100);

    throttled();
    throttled();
    throttled();

    expect(func).toHaveBeenCalledTimes(1); // Leading call

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(2); // Trailing call
  });

  test('handles leading: false option', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100, { leading: false });

    throttled();
    throttled();

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
  });

  test('handles trailing: false option', () => {
    const func = vi.fn();
    const throttled = throttle(func, 100, { trailing: false });

    throttled();
    throttled();

    expect(func).toHaveBeenCalledTimes(1); // Leading call

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1); // No trailing call
  });
});
