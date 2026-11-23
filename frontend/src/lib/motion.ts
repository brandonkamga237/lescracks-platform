/** Same curve as the CSS --ease-out, for animations driven from JavaScript. */
export const EASE = [0.23, 1, 0.32, 1] as const;

/** Reveals play once, when a tenth of the element has entered the screen. */
export const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -10% 0px' } as const;
