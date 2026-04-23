import { useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Select({
  label,
  options,
  value,
  onChange,
  className = '',
  ...rest
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs text-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#fafafc] text-text-primary rounded-[11px] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer"
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="w-4 h-4 text-text-tertiary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
