import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1 w-full">
        {label && (
          <label className="text-sm font-semibold text-[#082F49]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-[16px]
            bg-white/50 backdrop-blur-sm
            border ${error ? 'border-red-500' : 'border-white/80'}
            text-[#334155] placeholder:text-[#94A3B8]
            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-400' : 'focus:ring-[#06B6D4]'}
            transition-all duration-300 ease-in-out
            shadow-sm hover:bg-white/70 focus:bg-white
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
