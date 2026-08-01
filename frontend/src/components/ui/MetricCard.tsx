import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon className="h-5 w-5 text-white/90" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="text-sm text-white/70">{label}</p>
      </div>
    </div>
  );
}
