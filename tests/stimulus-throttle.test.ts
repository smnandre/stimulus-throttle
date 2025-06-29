import { Application, Controller } from '@hotwired/stimulus';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { extendApplicationWithThrottle, useThrottle, useThrottledListeners } from '../src';

// Mock timers to control throttle execution
vi.useFakeTimers();

describe('useThrottle', () => {
  let application: Application;
  let controller: Controller;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    element.setAttribute('data-controller', 'test');
    document.body.appendChild(element);

    application = Application.start();
    application.register('test', class extends Controller {
      static throttledListeners = {
        'custom-event': {
          method: 'onCustomEvent',
          throttle: { delay: 100 },
        },
      };

      onCustomEvent = vi.fn();

      connect() {
        useThrottle(this);
      }
    });

    // Wait for Stimulus to connect controllers
    await Promise.resolve();
    controller = application.getControllerForElementAndIdentifier(element, 'test')!;
  });

  afterEach(() => {
    application.stop();
    document.body.removeChild(element);
  });

  test('throttles the specified event', async () => {
    const onCustomEvent = (controller as any).onCustomEvent;

    // Wait for controller to be fully connected and listeners attached
    await Promise.resolve();
    await Promise.resolve();

    // Trigger the event multiple times
    element.dispatchEvent(new CustomEvent('custom-event'));
    element.dispatchEvent(new CustomEvent('custom-event'));
    element.dispatchEvent(new CustomEvent('custom-event'));

    // The method should be called once immediately (leading edge)
    expect(onCustomEvent).toHaveBeenCalledTimes(1);

    // Advance timers to the next throttle window
    vi.advanceTimersByTime(100);

    // Trigger the event again
    element.dispatchEvent(new CustomEvent('custom-event'));

    // The method should be called again
    expect(onCustomEvent).toHaveBeenCalledTimes(2);
  });
});

describe('useThrottledListeners', () => {
  let controller: Controller;
  let element: HTMLElement;
  let application: Application;

  beforeEach(async () => {
    element = document.createElement('div');
    element.setAttribute('data-controller', 'test');
    document.body.appendChild(element);

    application = Application.start();
    application.register('test', class extends Controller {
      onCustomEvent = vi.fn();
      connect() {
        useThrottledListeners(this, {
          'custom-event': {
            method: 'onCustomEvent',
            throttle: { delay: 100 },
          },
        });
      }
    });

    // Wait for Stimulus to connect controllers
    await Promise.resolve();
    controller = application.getControllerForElementAndIdentifier(element, 'test')!;
  });

  afterEach(() => {
    application.stop();
    document.body.removeChild(element);
  });

  test('wires up throttled listeners', async () => {
    const onCustomEvent = (controller as any).onCustomEvent;

    // Wait for controller to be fully connected and listeners attached
    await Promise.resolve();
    await Promise.resolve();

    // Trigger the event multiple times
    element.dispatchEvent(new CustomEvent('custom-event'));
    element.dispatchEvent(new CustomEvent('custom-event'));

    // The method should be called once
    expect(onCustomEvent).toHaveBeenCalledTimes(1);

    // Advance timers
    vi.advanceTimersByTime(100);

    // The method should be called again on the trailing edge
    expect(onCustomEvent).toHaveBeenCalledTimes(2);
  });

  test('throws error for string configuration', () => {
    expect(() => {
      const element2 = document.createElement('div');
      const controller = new (class extends Controller {
        constructor() {
          super({ application: Application.start(), identifier: 'test', element: element2 } as any);
        }
      })();
      
      useThrottledListeners(controller, {
        'custom-event': 'invalidStringConfig' as any
      });
    }).toThrow('Throttled listeners require a configuration object');
  });

  test('throws error for missing throttle configuration', () => {
    expect(() => {
      const element3 = document.createElement('div');
      const controller = new (class extends Controller {
        constructor() {
          super({ application: Application.start(), identifier: 'test', element: element3 } as any);
        }
      })();
      
      useThrottledListeners(controller, {
        'custom-event': {
          method: 'onCustomEvent'
          // Missing throttle config
        } as any
      });
    }).toThrow('Throttle configuration required for custom-event');
  });

  test('throws error for missing method', () => {
    expect(() => {
      const element4 = document.createElement('div');
      const controller = new (class extends Controller {
        constructor() {
          super({ application: Application.start(), identifier: 'test', element: element4 } as any);
        }
      })();
      
      useThrottledListeners(controller, {
        'custom-event': {
          method: 'nonExistentMethod',
          throttle: { delay: 100 }
        }
      });
    }).toThrow('Method nonExistentMethod not found on controller');
  });
});

describe('extendApplicationWithThrottle', () => {
  let application: Application;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    element.setAttribute('data-controller', 'test');
    element.setAttribute('data-action', 'scroll->test#onScroll:throttle:200ms');
    document.body.appendChild(element);

    application = Application.start();
    extendApplicationWithThrottle(application).registerThrottleModifiers();

    // Wait for Stimulus to connect controllers
    await Promise.resolve();
  });

  afterEach(() => {
    application.stop();
    document.body.removeChild(element);
  });

  test('adds :throttle action modifier', () => {
    const onScroll = vi.fn();

    application.register('test', class extends Controller {
      onScroll = onScroll;
    });

    // Wait for controller to be connected
    const controller = application.getControllerForElementAndIdentifier(element, 'test');
    expect(controller).not.toBeNull();

    // Trigger the event multiple times rapidly
    element.dispatchEvent(new Event('scroll'));
    element.dispatchEvent(new Event('scroll'));
    element.dispatchEvent(new Event('scroll'));

    // Should be called once immediately (leading)
    expect(onScroll).toHaveBeenCalledTimes(1);

    // Advance fake timers by the throttle delay (200ms)
    vi.advanceTimersByTime(200);

    // Should now be called again (trailing)
    expect(onScroll).toHaveBeenCalledTimes(2);
  });

  test('handles invalid throttle configurations gracefully', () => {
    const element3 = document.createElement('div');
    element3.setAttribute('data-controller', 'test3');
    element3.setAttribute('data-action', 'click->test3#onClick:throttle:invalid');
    document.body.appendChild(element3);

    const onClick = vi.fn();
    application.register('test3', class extends Controller {
      onClick = onClick;
    });

    // Should still work (fallback to no throttling or ignore invalid config)
    element3.dispatchEvent(new Event('click'));
    
    document.body.removeChild(element3);
  });
});
