const STATUS_STYLES = {
  planning: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planning' },
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  on_hold: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Hold' },
  completed: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Completed' },
  delayed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Delayed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.planning;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}