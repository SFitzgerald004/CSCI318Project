import { useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const VARIANTS = {
  light: {
    label: 'text-text-secondary',
    select: 'bg-[#fafafc] text-text-primary',
    chevron: 'text-text-tertiary',
  },
  dark: {
    label: 'text-gray-400',
    select: 'bg-surface-dark-2 text-white border border-white/10',
    chevron: 'text-gray-400',
  },
};

export default function Select({
  label,
  options,
  value,
  onChange,
  error,
  variant = 'light',
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
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none ${styles.select} rounded-[11px] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${styles.chevron}`} />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
