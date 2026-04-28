import { Minus, Plus } from 'lucide-react'

export default function QuantityInput({ value, onChange, min = 0, max = 9999 }) {
  const handleChange = (newVal) => {
    const v = Math.max(min, Math.min(max, newVal))
    onChange(v)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleChange(value - 1)}
        disabled={value <= min}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100
                   hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30
                   transition-all text-gray-700"
      >
        <Minus size={20} />
      </button>
      <input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={e => handleChange(parseInt(e.target.value) || 0)}
        className="w-16 h-11 text-center text-lg font-bold border border-gray-200 rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-brand-500
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                   [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        disabled={value >= max}
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-500
                   hover:bg-brand-600 active:bg-brand-700 disabled:opacity-30
                   transition-all text-white"
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
