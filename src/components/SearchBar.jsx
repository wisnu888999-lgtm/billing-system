import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'ค้นหา...' }) {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl
                   text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500
                   focus:border-transparent transition-all placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={18} className="text-gray-400" />
        </button>
      )}
    </div>
  )
}
