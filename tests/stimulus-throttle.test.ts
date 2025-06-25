import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useThrottle } from '../src/stimulus-throttle'

class TestController implements DelegationController {
  element: HTMLElement
}
