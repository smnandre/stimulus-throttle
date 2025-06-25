import { Application } from '@hotwired/stimulus';

interface ThrottleApplication extends Application {
  registerThrottleModifiers(): void;
}

declare module '@hotwired/stimulus' {
  interface Application {
    registerThrottleModifiers(): void;
  }
}

export function extendApplicationWithThrottle(application: Application): ThrottleApplication {
  const originalRegister = application.register.bind(application);
  
  // Store original action descriptor parser
  const originalParseActionDescriptorString = (application as any).actionDescriptorStringParser?.parseActionDescriptorString;
  
  application.registerThrottleModifiers = function() {
    // Extend action descriptor parsing to handle throttle modifiers
    if (originalParseActionDescriptorString) {
      (application as any).actionDescriptorStringParser.parseActionDescriptorString = function(descriptorString: string) {
        const result = originalParseActionDescriptorString.call(this, descriptorString);
        
        // Check for throttle modifier: "scroll->controller#method:throttle:500ms"
        if (descriptorString.includes(':throttle:')) {
          const parts = descriptorString.split(':throttle:');
          if (parts.length === 2) {
            const delayMatch = parts[1].match(/(\d+)ms?/);
            if (delayMatch) {
              result.options = result.options || {};
              result.options.throttle = {
                delay: parseInt(delayMatch[1], 10),
                leading: true,
                trailing: true
              };
            }
          }
        }
        
        return result;
      };
    }
  };

  application.register = function(identifier: string, controllerConstructor: any, options?: any) {
    // Auto-setup throttle for controllers that have throttledListeners
    if (controllerConstructor.throttledListeners) {
      const originalInitialize = controllerConstructor.prototype.initialize;
      controllerConstructor.prototype.initialize = function() {
        originalInitialize?.call(this);
        // Import and use throttle functionality
        import('./stimulus-throttle').then(({ useThrottle }) => {
          useThrottle(this);
        });
      };
    }
    
    return originalRegister(identifier, controllerConstructor, options);
  };

  return application as ThrottleApplication;
}

// Auto-register if Application is available globally
if (typeof window !== 'undefined' && (window as any).Stimulus?.Application) {
  const app = (window as any).Stimulus.Application.start();
  extendApplicationWithThrottle(app).registerThrottleModifiers();
}