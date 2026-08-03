import { LucideIcon } from 'lucide-react';

export type MetricTone = 'blue' | 'amber' | 'green' | 'red';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: MetricTone;
}

const TONE_CLASSES: Record<MetricTone, string> = {
  blue: 'bg-blue-400/20 text-blue-200',
  amber: 'bg-amber-400/20 text-amber-200',
  green: 'bg-emerald-400/20 text-emerald-200',
  red: 'bg-red-400/20 text-red-200',
};

export function MetricCard({ label, value, icon: Icon, tone = 'blue' }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="text-sm text-white/70">{label}</p>
      </div>
    </div>
  );
}
