import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function Reveal({
  children,
  delay = 0,
  duration = 0.6,
  y = 16,
  className = '',
  cascade = false
}) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : y
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : duration,
        delay: delay,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
