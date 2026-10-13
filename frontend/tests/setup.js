import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// ─── Mock global de fetch (evita llamadas reales a APIs externas) ─────────────
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ address: { road: 'Calle 19', neighbourhood: 'La Aurora' } }),
});

// ─── Mock global de framer-motion ─────────────────────────────────────────────
// AnimatePresence no renderiza de forma inmediata en jsdom, lo reemplazamos
// por un wrapper neutro que sí renderiza los hijos al instante.
vi.mock('framer-motion', () => {
  const createMotion = (tag) => {
    const Component = React.forwardRef(({ children, ...props }, ref) => {
      // Elimina props exclusivos de framer-motion que rompen el DOM
      const {
        initial, animate, exit, transition, variants,
        whileTap, whileHover, whileInView, custom,
        layout, layoutId, drag, dragConstraints,
        onAnimationComplete, onHoverStart, onHoverEnd,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  const tags = ['div','span','button','section','header','footer','nav','article',
                 'ul','li','p','h1','h2','h3','a','form','input','img','main'];

  const motion = {};
  tags.forEach(t => { motion[t] = createMotion(t); });

  return {
    motion,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useAnimation:    () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
    useInView:       () => true,
    useMotionValue:  (v) => ({ get: () => v, set: vi.fn() }),
    useTransform:    () => ({ get: () => 0 }),
    useSpring:       (v) => ({ get: () => v }),
    useDragControls: () => ({ start: vi.fn() }),
  };
});
