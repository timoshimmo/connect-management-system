import { RoleConfig, ViewKey, CountKey, SidebarItem } from '@/data/roles';
import { useDepartmentsQuery } from '@/features/departments/hooks';
import { useDisciplinesQuery } from '@/features/disciplines/hooks';

interface MSPublishingSidebarProps {
  role: RoleConfig;
  activeView: ViewKey;
  activeFilter?: string;
  counts: Partial<Record<CountKey, number>>;
  onNavigate: (view: ViewKey, filterValue?: string) => void;
}

export function MSPublishingSidebar({
  role,
  activeView,
  activeFilter,
  counts,
  onNavigate,
}: MSPublishingSidebarProps) {
  // Fetched unconditionally (never inside a loop) — enabled only when this
  // role's sidebar actually has a matching `dynamicSource` marker (see
  // roles.ts) so other roles don't fire an unnecessary request.
  const needsDepartments = role.sidebar.some((item) => item.dynamicSource === 'departments');
  const needsDisciplines = role.sidebar.some((item) => item.dynamicSource === 'disciplines');
  const { data: departments = [] } = useDepartmentsQuery(needsDepartments);
  const { data: disciplines = [] } = useDisciplinesQuery(needsDisciplines);

  const expanded: SidebarItem[] = role.sidebar.flatMap((item) => {
    if (item.dynamicSource === 'departments') {
      return departments.map((d) => ({ ...item, label: d.name, filterValue: d.name }));
    }
    if (item.dynamicSource === 'disciplines') {
      return disciplines.map((d) => ({ ...item, label: d.name, filterValue: d.name }));
    }
    return [item];
  });

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3.5 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Signed in as</p>
        <p className="mt-1 text-sm font-semibold text-gray-800">{role.label}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400">{role.description}</p>
      </div>

      <nav className="rounded-xl border border-gray-200 bg-white p-2 shadow-card">
        {expanded.map((item, i) => {
          if (item.divider) {
            return (
              <div
                key={`divider-${i}`}
                className="mb-1 mt-3 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 first:mt-0"
              >
                {item.divider}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive =
            item.view === activeView &&
            (item.filterValue ? item.filterValue === activeFilter : !activeFilter || (activeView !== 'dept' && activeView !== 'discipline'));
          const count = item.countKey ? counts[item.countKey] : undefined;
          return (
            <button
              key={`${item.view}-${item.filterValue ?? i}`}
              type="button"
              onClick={() => onNavigate(item.view!, item.filterValue)}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                isActive ? 'bg-brand-50 text-brand-800' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0 text-brand-700" /> : <span className="w-4 shrink-0" />}
              <span className="flex-1 truncate">{item.label}</span>
              {!!count && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white ${
                    item.chipType === 'danger'
                      ? 'bg-red-600'
                      : item.chipType === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-brand-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
