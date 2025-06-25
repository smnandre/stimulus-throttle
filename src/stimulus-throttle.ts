import { Controller } from '@hotwired/stimulus';

type ThrottleConfig = {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
};

const throttleRegistry = new WeakMap<any, Map<string, any>>();

function throttle(func: Function, delay: number, options: { leading?: boolean; trailing?: boolean } = {}) {
  const { leading = true, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  return function throttled(this: any, ...args: any[]) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;
    lastThis = this;

    if (lastCallTime === 0 && !leading) {
      lastCallTime = now;
      return;
    }

    if (timeSinceLastCall >= delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      return func.apply(this, args);
    }

    if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = leading ? Date.now() : 0;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
        }
      }, delay - timeSinceLastCall);
    }
  };
}

function wireThrottledListeners(controller: Controller, listeners: Record<string, any>) {
  const originalConnect = controller.connect?.bind(controller);
  const originalDisconnect = controller.disconnect?.bind(controller);

  controller.connect = function () {
    originalConnect?.();
    
    const throttledMethods = new Map();
    throttleRegistry.set(this, throttledMethods);

    Object.entries(listeners).forEach(([eventName, config]) => {
      let methodName: string;
      let throttleConfig: ThrottleConfig;
      let eventOptions: AddEventListenerOptions | undefined;

      if (typeof config === 'string') {
        throw new Error('Throttled listeners require configuration object');
      } else if (Array.isArray(config)) {
        const [method, options] = config;
        methodName = method;
        throttleConfig = options.throttle;
        eventOptions = { ...options };
        delete (eventOptions as any).throttle;
      } else {
        methodName = config.method;
        throttleConfig = config.throttle;
        eventOptions = config.options;
      }

      if (!throttleConfig) {
        throw new Error(`Throttle configuration required for ${eventName}`);
      }

      const originalMethod = (this as any)[methodName];
      if (typeof originalMethod !== 'function') {
        throw new Error(`Method ${methodName} not found on controller`);
      }

      const throttledMethod = throttle(
        originalMethod.bind(this),
        throttleConfig.delay,
        {
          leading: throttleConfig.leading,
          trailing: throttleConfig.trailing
        }
      );

      throttledMethods.set(methodName, throttledMethod);
      this.element.addEventListener(eventName, throttledMethod, eventOptions);
    });
  };

  controller.disconnect = function () {
    const throttledMethods = throttleRegistry.get(this);
    if (throttledMethods) {
      // Cleanup is handled by Stimulus controller lifecycle
      throttleRegistry.delete(this);
    }
    originalDisconnect?.();
  };
}

export function useThrottle(controller: Controller) {
  const ctor = controller.constructor as any;
  const throttledListeners = ctor.throttledListeners;
  if (throttledListeners) {
    wireThrottledListeners(controller, throttledListeners);
  }
}

export function useThrottledListeners(controller: Controller, listeners: Record<string, any>) {
  wireThrottledListeners(controller, listeners);
}