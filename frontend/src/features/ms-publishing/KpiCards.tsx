export interface KpiStat {
  label: string;
  value: number;
  sub?: string;
  tone?: 'default' | 'amber' | 'red';
}

const TONE_CLASSES: Record<NonNullable<KpiStat['tone']>, string> = {
  default: 'text-brand-800',
  amber: 'text-amber-600',
  red: 'text-red-600',
};

export function KpiCards({ stats }: { stats: KpiStat[] }) {
  return (
    <div
      className="mb-6 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium text-gray-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${TONE_CLASSES[stat.tone ?? 'default']}`}>
            {stat.value}
          </p>
          {stat.sub && <p className="mt-1 text-[11px] text-gray-400">{stat.sub}</p>}
        </div>
      ))}
    </div>
  );
}
