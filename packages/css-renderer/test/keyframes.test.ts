import { describe, it, expect } from 'vitest';
import { keyframesToCss, easingToCss } from '../src/index';

describe('css-renderer', () => {
  it('generates keyframes css', () => {
    const css = keyframesToCss('spin', {
      0: { transform: { rotateZ: 0 } },
      100: { transform: { rotateZ: 360 } }
    });
    expect(css).toContain('@keyframes spin');
    expect(css).toContain('rotateZ(360deg)');
  });

  it('converts easing', () => {
    expect(easingToCss('ease-out')).toBe('ease-out');
    expect(easingToCss({ cubicBezier: [0.2, 0.5, 0.3, 1] })).toContain('cubic-bezier');
  });
});
