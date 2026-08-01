import { MSPublishingCard } from './MSPublishingCard';
import { ReadSiteCard } from './ReadSiteCard';
import { DrawingRegisterCard } from './DrawingRegisterCard';
import { FEATURES } from '@/config/features';

export function NewModulesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">New Modules</h2>
        <p className="mt-1 text-sm text-gray-500">
          Explore the latest additions to the management system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2">
        <MSPublishingCard />
        <ReadSiteCard />
        {FEATURES.drawingRegister && <DrawingRegisterCard />}
      </div>
    </section>
  );
}
