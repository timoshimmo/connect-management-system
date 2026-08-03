import { MSPublishingCard } from './MSPublishingCard';
import { OnshoreCard } from './OnshoreCard';
import { OffshoreCard } from './OffshoreCard';
import { ReadSiteCard } from './ReadSiteCard';

export function NewModulesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OnshoreCard />
        <OffshoreCard />
        <MSPublishingCard />
      </div>
      <div className="mt-6">
        <ReadSiteCard />
      </div>
    </section>
  );
}
