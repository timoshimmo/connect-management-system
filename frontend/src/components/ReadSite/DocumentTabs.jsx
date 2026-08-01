export const DOCUMENT_TABS = [
  { id: 'recently-updated', label: 'Recently Updated' },
  { id: 'all-documents', label: 'All Documents' },
  { id: 'onshore', label: 'Onshore' },
  { id: 'offshore-mayo-abo', label: 'Offshore – Mayo ABO' },
];

/**
 * Underline-style document tabs. Active tab state lives in the parent page
 * and is passed down, so this component can be reused wherever a similar
 * tabbed filter is needed.
 */
export default function DocumentTabs({ activeTab, onChange }) {
  return (
    <div role="tablist" aria-label="Document filters" className="flex gap-6 overflow-x-auto border-b border-gray-200">
      {DOCUMENT_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
              isActive
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
