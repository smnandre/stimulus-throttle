# Stimulus Throttle

A Stimulus controller to throttle events.

This library provides a `throttle` function and a Stimulus controller that makes it easy to throttle events in your Stimulus applications. You can use it to limit the rate at which a function is called, for example, to prevent a function from being called too frequently on `scroll` or `resize` events.

## Installation

```bash
npm install stimulus-throttle
```

## Usage

There are two ways to use this library:

### 1. Using `useThrottle` with `throttledListeners`

You can use the `useThrottle` function to automatically wire up throttled event listeners on your Stimulus controller. To do this, add a static `throttledListeners` object to your controller, where the keys are the event names and the values are the configuration for the throttled listener.

```javascript
// src/controllers/my-controller.js
import { Controller } from '@hotwired/stimulus';
import { useThrottle } from 'stimulus-throttle';

export default class extends Controller {
  static throttledListeners = {
    scroll: {
      method: 'onScroll',
      throttle: {
        delay: 100,
        leading: true,
        trailing: false,
      },
      options: {
        passive: true,
      },
    },
  };

  connect() {
    useThrottle(this);
  }

  onScroll(event) {
    console.log('scrolling');
  }
}
```

### 2. Using the action modifier syntax

This library also extends the Stimulus `Application` object to allow you to use a `:throttle` modifier in your action descriptors. To enable this, you need to call `registerThrottleModifiers` on your Stimulus application instance.

```javascript
// src/application.js
import { Application } from '@hotwired/stimulus';
import { extendApplicationWithThrottle } from 'stimulus-throttle';

const application = Application.start();
extendApplicationWithThrottle(application).registerThrottleModifiers();
window.Stimulus = application;
```

Once you've done this, you can use the `:throttle` modifier in your HTML:

```html
<div data-controller="my-controller" data-action="scroll->my-controller#onScroll:throttle:500ms">
  ...
</div>
```

This will throttle the `onScroll` method to be called at most once every 500 milliseconds.

## API

### `useThrottle(controller)`

Automatically wires up throttled event listeners on the given Stimulus controller based on the `throttledListeners` static property.

### `useThrottledListeners(controller, listeners)`

Wires up the given throttled event listeners on the given Stimulus controller.

### `extendApplicationWithThrottle(application)`

Extends the given Stimulus `Application` object with the ability to use the `:throttle` action modifier.

### `throttle(func, delay, options)`

Creates a throttled function that only invokes `func` at most once per every `delay` milliseconds.

#### `options`

- `leading` (boolean, default: `true`): Whether to invoke the function on the leading edge of the timeout.
- `trailing` (boolean, default: `true`): Whether to invoke the function on the trailing edge of the timeout.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/smnandre/stimulus-throttle.

## License

Released under the [MIT License](LICENSE) by [Simon André](https://github.com/smnandre).
