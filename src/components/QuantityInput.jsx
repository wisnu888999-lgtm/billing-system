import { Minus, Plus } from 'lucide-react'

export default function QuantityInput({ value, onChange, min = 0, max = 9999, size = 'md' }) {
  const isSm = size === 'sm'
  const btnClass = isSm ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'
  const inputClass = isSm ? 'w-10 h-8 text-sm rounded-lg' : 'w-16 h-11 text-lg rounded-xl'
  const iconSize = isSm ? 16 : 20

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
        className={`${btnClass} flex items-center justify-center bg-gray-100
                   hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30
                   transition-all text-gray-700`}
      >
        <Minus size={iconSize} />
      </button>
      <input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={e => handleChange(parseInt(e.target.value) || 0)}
        className={`${inputClass} text-center font-bold border border-gray-200
                   focus:outline-none focus:ring-2 focus:ring-brand-500
                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                   [&::-webkit-inner-spin-button]:appearance-none`}
      />
      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        disabled={value >= max}
        className={`${btnClass} flex items-center justify-center bg-brand-500
                   hover:bg-brand-600 active:bg-brand-700 disabled:opacity-30
                   transition-all text-white`}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  )
}
