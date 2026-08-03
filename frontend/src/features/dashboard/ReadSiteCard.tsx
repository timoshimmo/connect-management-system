import {
  FileText,
  ClipboardList,
  Ruler,
  Clock,
} from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FooterLink,
  RoleLink,
} from '@/components/ui';

const sections = [
  { to: '/read-site', icon: FileText, label: 'All Policies', description: 'Browse by department' },
  { to: '/read-site', icon: ClipboardList, label: 'Procedures', description: 'Step-by-step guides' },
  { to: '/drawing-register/login', icon: Ruler, label: 'Standards & Specs', description: 'Technical references' },
  { to: '/read-site', icon: Clock, label: 'Recently Updated', description: 'Latest revisions' },
];

export function ReadSiteCard() {
  return (
    <Card hover className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Read Site</h3>
              <Badge variant="new">New</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Browse all approved, published management system documents — the single source of truth
              for all STAC staff.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex-1">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {sections.map((section) => (
            <RoleLink
              key={section.label}
              to={section.to}
              icon={section.icon}
              label={section.label}
              description={section.description}
            />
          ))}
        </div>
      </CardBody>

      <CardFooter>
        <FooterLink to="/read-site" label="Open Read Site" />
      </CardFooter>
    </Card>
  );
}
