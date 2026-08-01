import { WORKFLOW_STEPS } from '@/data/roles';

interface WorkflowBarProps {
  activeStep: number;
  /** Defaults to the document lifecycle's 6 steps; pass a different set (e.g. the Drawing Register's 3) to reuse this same strip. */
  steps?: readonly string[];
}

/** Progress strip mirroring a role config's workflow lifecycle. */
export function WorkflowBar({ activeStep, steps = WORKFLOW_STEPS }: WorkflowBarProps) {
  return (
    <div className="mb-6 flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === activeStep;
        return (
          <div
            key={label}
            className={`flex-1 border-r border-gray-100 px-3 py-3 text-center last:border-r-0 ${
              isActive ? 'bg-brand-800' : ''
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wide ${
                isActive ? 'text-white/70' : 'text-brand-700'
              }`}
            >
              Step {step}
            </div>
            <div className={`mt-0.5 text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
