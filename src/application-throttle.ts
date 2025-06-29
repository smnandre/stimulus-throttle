import { Application } from '@hotwired/stimulus';
import { throttle } from './stimulus-throttle';

interface ThrottleApplication extends Application {
  registerThrottleModifiers(): void;
}

declare module '@hotwired/stimulus' {
  interface Application {
    registerThrottleModifiers(): void;
  }
}

// Parse throttle configuration from action descriptor
function parseThrottleConfig(actionDescriptor: string): { delay: number; leading?: boolean; trailing?: boolean } | null {
  const throttleMatch = actionDescriptor.match(/:throttle:(\d+)(ms)?(?::(\w+))?(?::(\w+))?/);
  if (!throttleMatch) return null;

  const delay = parseInt(throttleMatch[1], 10);
  const config: { delay: number; leading?: boolean; trailing?: boolean } = { delay };

  // Parse additional options (leading/trailing)
  if (throttleMatch[3]) {
    if (throttleMatch[3] === 'leading') config.leading = true;
    if (throttleMatch[3] === 'trailing') config.trailing = true;
    if (throttleMatch[3] === 'noleading') config.leading = false;
    if (throttleMatch[3] === 'notrailing') config.trailing = false;
  }
  if (throttleMatch[4]) {
    if (throttleMatch[4] === 'leading') config.leading = true;
    if (throttleMatch[4] === 'trailing') config.trailing = true;
    if (throttleMatch[4] === 'noleading') config.leading = false;
    if (throttleMatch[4] === 'notrailing') config.trailing = false;
  }

  return config;
}

export function extendApplicationWithThrottle(application: Application): ThrottleApplication {
  const originalRegister = application.register.bind(application);

  application.registerThrottleModifiers = function() {
    // Override the application's register method to intercept controller registration
    application.register = function(identifier: string, controllerConstructor: any) {
      // Create a new controller class that wraps the original
      class ThrottleWrappedController extends controllerConstructor {
        connect() {
          super.connect();
          this.setupThrottledActions();
        }

        disconnect() {
          this.cleanupThrottledActions();
          super.disconnect();
        }

        setupThrottledActions() {
          const dataAction = this.element.getAttribute('data-action');
          if (!dataAction) return;

          const actions = dataAction.split(/\s+/);
          const throttledActions = actions.filter((action: string) => 
            action.includes(':throttle:') && action.includes(`${identifier}#`)
          );

          if (throttledActions.length === 0) return;

          throttledActions.forEach((actionDescriptor: string) => {
            const throttleConfig = parseThrottleConfig(actionDescriptor);
            if (!throttleConfig) return;

            // Extract parts: "event->controller#method:throttle:100ms"
            const [, actionPart] = actionDescriptor.split('->');
            const [controllerAction] = actionPart.split(':throttle:');
            const [, methodName] = controllerAction.split('#');

            // Get the original method
            const originalMethod = this[methodName];
            if (typeof originalMethod !== 'function') return;

            // Create throttled version and replace the method on this instance
            this[methodName] = throttle(
              originalMethod.bind(this),
              throttleConfig.delay,
              {
                leading: throttleConfig.leading !== false,
                trailing: throttleConfig.trailing !== false
              }
            );

            // Store reference for cleanup
            if (!this._throttledMethods) {
              this._throttledMethods = new Set();
            }
            this._throttledMethods.add(methodName);
          });
        }

        cleanupThrottledActions() {
          // Cleanup is handled automatically since we're replacing methods on the instance
          // The throttled functions will be garbage collected when the controller is destroyed
        }
      }

      // Preserve the original controller's static properties
      Object.setPrototypeOf(ThrottleWrappedController, controllerConstructor);
      Object.getOwnPropertyNames(controllerConstructor).forEach(name => {
        if (name !== 'prototype' && name !== 'name' && name !== 'length') {
          (ThrottleWrappedController as any)[name] = (controllerConstructor as any)[name];
        }
      });

      return originalRegister(identifier, ThrottleWrappedController as any);
    };
  };

  return application as ThrottleApplication;
}

// Auto-register if Application is available globally
if (typeof window !== 'undefined' && (window as any).Stimulus?.Application) {
  const app = (window as any).Stimulus.Application.start();
  extendApplicationWithThrottle(app).registerThrottleModifiers();
}
