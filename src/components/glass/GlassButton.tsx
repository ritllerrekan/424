import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-500/20 border-blue-400/30 text-blue-50 hover:bg-blue-500/30 hover:border-blue-400/50',
    secondary: 'bg-gray-500/20 border-gray-400/30 text-gray-50 hover:bg-gray-500/30 hover:border-gray-400/50',
    accent: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-50 hover:bg-emerald-500/30 hover:border-emerald-400/50',
    danger: 'bg-red-500/20 border-red-400/30 text-red-50 hover:bg-red-500/30 hover:border-red-400/50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        backdrop-blur-md border rounded-xl
        shadow-glass-sm font-medium
        transition-all duration-300
        hover:shadow-glass hover:scale-105
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
