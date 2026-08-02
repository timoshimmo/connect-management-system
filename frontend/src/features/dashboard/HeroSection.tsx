import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MetricCard } from '@/components/ui';
import { useReadSiteStatsQuery } from '@/features/read-site';

export function HeroSection() {
  const { data: stats, isLoading } = useReadSiteStatsQuery();

  const metrics = [
    { label: 'Total Documents', value: stats?.totalDocuments, icon: FileText },
    { label: 'Pending Approval', value: stats?.pendingApproval, icon: Clock },
    { label: 'Published This Month', value: stats?.publishedThisMonth, icon: CheckCircle2 },
    { label: 'Due for Review', value: stats?.dueForReview, icon: AlertCircle },
  ];

  return (
    <section className="bg-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Management System Dashboard
          </h1>
          <p className="mt-3 text-base leading-relaxed text-white/75 sm:text-lg">
            Central hub for document publishing, review workflows, and
            organization-wide knowledge access.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={isLoading || metric.value === undefined ? '—' : metric.value}
              icon={metric.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
