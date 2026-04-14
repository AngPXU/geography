import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex justify-center items-center font-bold px-6 py-3 rounded-[16px] transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-[#06B6D4] hover:bg-[#22D3EE] text-white focus:ring-[#06B6D4]",
    secondary: "bg-[#22C55E] hover:bg-[#4ADE80] text-white focus:ring-[#22C55E]",
    outline: "bg-transparent border-2 border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4]/10 focus:ring-[#06B6D4]",
    ghost: "bg-transparent text-[#334155] hover:bg-[#f1f5f9] focus:ring-slate-300",
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
