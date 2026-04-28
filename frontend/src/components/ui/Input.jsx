import { useId } from 'react';

const VARIANTS = {
  light: {
    label: 'text-text-secondary',
    input: 'bg-[#fafafc] text-text-primary placeholder:text-gray-400',
  },
  dark: {
    label: 'text-gray-400',
    input: 'bg-surface-dark-2 text-white placeholder:text-gray-600 border border-white/10',
  },
};

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  variant = 'light',
  required = false,
  className = '',
  ...rest
}) {
  const id = useId();
  const styles = VARIANTS[variant] || VARIANTS.light;
  return (
    <div className={className}>
      <label htmlFor={id} className={`block text-xs ${styles.label} mb-1.5`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full ${styles.input} rounded-[11px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow`}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
