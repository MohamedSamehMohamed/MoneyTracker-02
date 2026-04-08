interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const ICONS = [
  '💰', '💵', '💸', '📈', '💳', '🏦', '🪙', '💎', '🧾',
  '🍔', '🍕', '🥗', '🍎', '☕', '🍷', '🍺', '🛒', '🏪',
  '🏠', '🏡', '🏢', '🏨', '🏥', '🏫', '🏭', '🏟️', '🏖️',
  '✈️', '🚗', '🚕', '🚌', '🚇', '🚲', '⛽', '🅿️', '🎫',
  '📱', '💻', '📺', '🎮', '🎬', '📚', '✏️', '🖨️', '💿',
  '👔', '👗', '👟', '🎁', '🎄', '🎂', '🎉', '🎵', '🎨',
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Icon
      </label>
      <div className="grid grid-cols-10 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        {ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`w-8 h-8 text-xl rounded-md flex items-center justify-center transition-all hover:bg-gray-200 ${
              value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
