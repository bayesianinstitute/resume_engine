import React, { useState } from 'react';

// Main Select component
interface SelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

// Select Component: Wraps around the native select element
export function Select({ onValueChange, defaultValue, children }: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue || '');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedValue(value);
    onValueChange(value);
  };

  return (
    <div className="select-container">
      <select value={selectedValue} onChange={handleChange} className="select-input">
        {children}
      </select>
    </div>
  );
}

// SelectContent Component: Optional wrapper for options content
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// SelectItem Component: Represents an option inside the select dropdown
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

// SelectTrigger Component: An optional wrapper to customize how the select is triggered (if needed)
export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <div className="select-trigger">{children}</div>;
}

// SelectValue Component: Displays the currently selected value with a placeholder
export function SelectValue({ placeholder }: { placeholder: string }) {
  return <span className="select-value">{placeholder}</span>;
}
