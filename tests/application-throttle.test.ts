import { Application, Controller } from '@hotwired/stimulus';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { extendApplicationWithThrottle } from '../src/application-throttle';

vi.useRealTimers();

describe('extendApplicationWithThrottle', () => {
  let application: Application;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    application = Application.start(element);
    extendApplicationWithThrottle(application);
    (application as any).registerThrottleModifiers();
  });

  afterEach(() => {
    application.stop();
    document.body.removeChild(element);
  });

  test('throttles actions with modifier', async () => {
    const onAction = vi.fn();
    application.register('test', class extends Controller {
      action = onAction;
    });

    element.setAttribute('data-controller', 'test');
    element.setAttribute('data-action', 'click->test#action:throttle:200ms');

    await new Promise(resolve => setTimeout(resolve, 0));

    element.click();
    expect(onAction).toHaveBeenCalledTimes(1);

    element.click();
    element.click();
    expect(onAction).toHaveBeenCalledTimes(1);

    await new Promise(resolve => setTimeout(resolve, 200));
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  test('does not throttle actions without modifier', async () => {
    const onAction = vi.fn();
    application.register('test', class extends Controller {
      action = onAction;
    });

    element.setAttribute('data-controller', 'test');
    element.setAttribute('data-action', 'click->test#action');

    await new Promise(resolve => setTimeout(resolve, 0));

    element.click();
    element.click();
    element.click();

    expect(onAction).toHaveBeenCalledTimes(3);
  });
});
