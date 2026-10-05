import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  type = 'button',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Subtle magnetic pull toward cursor (if motion allowed)
  const handleMouseMove = (e) => {
    if (shouldReduceMotion || disabled || loading) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (clientX - centerX) * 0.12;
    const deltaY = (clientY - centerY) * 0.12;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-2xl gap-2.5'
  };

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#FF5E00] text-white shadow-lg shadow-[#FF5E00]/25 hover:shadow-[#FF5E00]/40 hover:bg-[#e05300] active:scale-[0.98] shimmer-sweep';
      break;
    case 'secondary':
      variantClasses =
        'border-2 border-[#7C3AED] text-[#7C3AED] bg-transparent hover:bg-[#F3EEFF] shadow-sm hover:shadow-[#7C3AED]/15';
      break;
    case 'outline':
      variantClasses =
        'border border-[#EDEDED] text-[#111111] bg-white hover:bg-[#FAFAFA] hover:border-[#D4D4D8] shadow-sm';
      break;
    case 'ghost':
      variantClasses =
        'text-[#6B6B6B] hover:text-[#111111] hover:bg-[#FAFAFA]';
      break;
    default:
      variantClasses = 'bg-[#FF5E00] text-white';
  }

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={shouldReduceMotion ? {} : { x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none relative overflow-hidden ${sizeClasses[size]} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
