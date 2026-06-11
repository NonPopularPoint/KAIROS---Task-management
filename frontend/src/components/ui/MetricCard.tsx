import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

export function MetricCard({ icon: Icon, value, label, iconBg, iconColor, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} mb-4`}>
        <Icon size={24} className={iconColor} />
      </div>
      <p className="text-4xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}
