import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement IntersectionObserver at all (not even as a no-op) — framer-motion's
// useInView (used by CountUp and MotionReveal) throws a ReferenceError without this stub. It never
// fires a callback, so components under test just render their pre-animation initial state, which
// is exactly what CountUp.test.tsx asserts against.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error — a deliberately minimal stub, not a full IntersectionObserver implementation
globalThis.IntersectionObserver = MockIntersectionObserver;
