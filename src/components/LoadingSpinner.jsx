export default function LoadingSpinner({ text = 'กำลังโหลด...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 text-sm">{text}</p>
    </div>
  )
}
