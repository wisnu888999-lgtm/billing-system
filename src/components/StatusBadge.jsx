import { getStatusLabel, getStatusColor } from '../lib/utils'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
      {status === 'paid' && '✅ '}
      {status === 'pending' && '⏳ '}
      {status === 'overdue' && '🔴 '}
      {getStatusLabel(status)}
    </span>
  )
}
