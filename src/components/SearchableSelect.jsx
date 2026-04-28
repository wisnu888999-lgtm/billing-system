import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export default function SearchableSelect({ label, value, onChange, options, placeholder, listId }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Filter options based on input value
  const filteredOptions = options.filter(opt => 
    String(opt).toLowerCase().includes(String(value).toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pr-10 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all bg-white"
        />
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-500 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto animate-fadeIn py-2">
          {filteredOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors ${value === opt ? 'bg-brand-50 text-brand-700 font-bold' : 'text-gray-600'}`}
              onClick={() => {
                onChange(opt)
                setIsOpen(false)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
