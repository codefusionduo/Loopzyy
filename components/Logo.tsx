import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div 
      className={`
        bg-blue-600
        flex items-center justify-center 
        rounded-full
        shadow-lg shadow-blue-600/30 
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${iconSizes[size]} text-white`}
      >
        {/* Continuous Infinity Loop Path */}
        <path 
          d="M12 12C10 9.33 7 8 5 8C2.79 8 1 9.79 1 12C1 14.21 2.79 16 5 16C7 16 10 14.67 12 12ZM12 12C14 14.67 17 16 19 16C21.21 16 23 14.21 23 12C23 9.79 21.21 8 19 8C17 8 14 9.33 12 12Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};