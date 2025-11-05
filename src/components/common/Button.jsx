import React from 'react';

export function Button({ children, variant = 'default', className = '', ...props }) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-900',
    ghost: 'hover:bg-gray-100 text-gray-900',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
