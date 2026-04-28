import { PackageOpen } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageOpen, title = 'ไม่มีข้อมูล', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon size={56} strokeWidth={1.2} />
      <p className="mt-4 text-lg font-medium text-gray-500">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  )
}
