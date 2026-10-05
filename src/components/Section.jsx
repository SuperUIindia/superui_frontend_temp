import React from 'react';

export default function Section({
  children,
  id,
  className = '',
  containerClassName = '',
  as: Component = 'section'
}) {
  return (
    <Component
      id={id}
      className={`relative py-16 md:py-24 overflow-hidden ${className}`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        {children}
      </div>
    </Component>
  );
}
