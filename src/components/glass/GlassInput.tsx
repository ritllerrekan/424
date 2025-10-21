import React from 'react';

interface GlassInputProps {
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  icon,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full backdrop-blur-md bg-white/10 border border-white/20
            rounded-xl px-4 py-3 text-white placeholder-white/40
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40
            hover:bg-white/15
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-400/50 focus:ring-red-400/30' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  );
};

interface GlassTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  className?: string;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`
          w-full backdrop-blur-md bg-white/10 border border-white/20
          rounded-xl px-4 py-3 text-white placeholder-white/40
          transition-all duration-300 resize-none
          focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40
          hover:bg-white/15
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400/50 focus:ring-red-400/30' : ''}
        `}
      />
      {error && (
        <p className="text-sm text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  );
};

interface GlassSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full backdrop-blur-md bg-white/10 border border-white/20
          rounded-xl px-4 py-3 text-white
          transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40
          hover:bg-white/15
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-400/50 focus:ring-red-400/30' : ''}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  );
};
