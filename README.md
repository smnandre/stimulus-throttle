# Stimulus Throttle

A TypeScript-compatible package for throttling event handlers in Stimulus controllers with support for custom action modifiers and declarative configuration.

## Features

- **Custom Action Modifiers**: Use `throttle:500ms` in your HTML action descriptors
- **Declarative Configuration**: Define `static throttledListeners` in your controllers  
- **Auto-Registration**: Automatically registers with Stimulus Application
- **Performance Optimized**: Efficient throttling with leading/trailing options
- **TypeScript Support**: Full type safety and IDE autocomplete

## Installation

```bash
npm install @smnandre/stimulus-throttle
```

## Usage

### Custom Action Modifiers (Automatic)

Just import the package and use throttle modifiers in your HTML:

```js
import '@smnandre/stimulus-throttle';
```

```html
<!-- Throttle scroll events to 100ms -->
<div data-controller="scroll" 
     data-action="scroll->scroll#onScroll:throttle:100ms">
</div>

<!-- Throttle input events to 250ms -->
<input data-controller="search"
       data-action="input->search#onInput:throttle:250ms">
```

### Declarative Listeners

```js
import { Controller } from '@hotwired/stimulus';
import { useThrottle } from '@smnandre/stimulus-throttle';

export default class extends Controller {
  static throttledListeners = {
    'scroll': ['onScroll', { throttle: { delay: 100 } }],
    'input': { 
      method: 'onInput', 
      throttle: { delay: 250, leading: false, trailing: true }
    }
  };

  initialize() {
    useThrottle(this);
  }

  onScroll(event) {
    // Throttled to 100ms
  }

  onInput(event) {
    // Throttled to 250ms, trailing only
  }
}
```

### Imperative Setup

```js
import { useThrottledListeners } from '@smnandre/stimulus-throttle';

export default class extends Controller {
  connect() {
    useThrottledListeners(this, {
      'resize': ['onResize', { throttle: { delay: 100 } }]
    });
  }
}
```

## Configuration Options

```js
{
  delay: 250,        // Throttle delay in milliseconds
  leading: true,     // Fire on leading edge (default: true)
  trailing: true     // Fire on trailing edge (default: true)  
}
```

## License

MIT
