const COLORS = {
  blue: 'border-blue-500 bg-blue-50 text-blue-600',
  green: 'border-green-500 bg-green-50 text-green-600',
  red: 'border-red-500 bg-red-50 text-red-600',
  orange: 'border-orange-500 bg-orange-50 text-orange-600',
  indigo: 'border-indigo-500 bg-indigo-50 text-indigo-600',
  purple: 'border-purple-500 bg-purple-50 text-purple-600',
};

export default function KPICard({ title, value, icon, color = 'blue', subtitle }) {
  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm border-l-4 ${COLORS[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}