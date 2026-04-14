import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`
        bg-white/75 backdrop-blur-[20px]
        border border-white
        shadow-[0_10px_30px_rgba(14,165,233,0.08)]
        rounded-[24px]
        p-6 md:p-8
        transition-all duration-300 ease-in-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};
