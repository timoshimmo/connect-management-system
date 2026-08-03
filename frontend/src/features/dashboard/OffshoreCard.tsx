import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Badge } from '@/components/ui';
import { FEATURES } from '@/config/features';

const DISCIPLINES = 'Mechanical, Piping, Civil, Electrical, Instrumentation';
const STAGES = ['New Drawing', 'Under Review', 'Approved Drawings'];

/**
 * Dashboard landing page column mirroring OnshoreCard's position — "Mayo
 * ABO" is the offshore facility name (not linked to anything yet), and the
 * Engineering box promotes the Drawing Register, the separately-
 * authenticated storefront for engineering/CAD documents. Gated by
 * FEATURES.drawingRegister, same as the rest of that module.
 */
export function OffshoreCard() {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <h3 className="border-b border-gray-100 pb-2.5 text-sm font-semibold text-gray-900">
        Management System Offshore
      </h3>
      <p className="mt-3 text-sm font-medium text-gray-700">Mayo ABO</p>

      {FEATURES.drawingRegister && (
        <div className="mt-3 rounded-lg border border-dashed border-gray-200 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Engineering</p>
          <Link to="/drawing-register/login" className="group mt-2 flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100">
              <Compass className="h-4 w-4 text-brand-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-900 group-hover:text-brand-800">Drawing Register</span>
                <Badge variant="new">New</Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">Engineering drawings and CAD files — {DISCIPLINES}</p>
            </div>
          </Link>
          <p className="mt-2.5 text-[11px] text-gray-400">{STAGES.join(' | ')}</p>
        </div>
      )}
    </div>
  );
}
