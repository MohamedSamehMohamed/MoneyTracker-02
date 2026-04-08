import { useState, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#F8B500', '#FF7F50',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8C471', '#82E0AA', '#F1948A', '#D7BDE2',
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [localText, setLocalText] = useState(value || '');

  useEffect(() => {
    setLocalText(value || '');
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Color
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
              value === color ? 'border-gray-900 ring-2 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#D3D3D3'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0.5 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={localText}
          onChange={(e) => {
            const color = e.target.value;
            setLocalText(color);
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
              onChange(color);
            }
          }}
          placeholder="#D3D3D"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}
