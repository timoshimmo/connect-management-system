import {
  Scale,
  HardHat,
  Users,
  FolderOpen,
} from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FooterLink,
  DepartmentLink,
} from '@/components/ui';

const departments = [
  { to: '/read-site/compliance', icon: Scale, label: 'Compliance', count: 24 },
  { to: '/read-site/hse', icon: HardHat, label: 'HSE', count: 18 },
  { to: '/read-site/hr', icon: Users, label: 'HR', count: 31 },
  { to: '/read-site', icon: FolderOpen, label: 'Browse all' },
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
              Staff-wide access to published documents by department
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex-1">
        <div className="flex flex-col gap-2.5">
          {departments.map((dept) => (
            <DepartmentLink
              key={dept.label}
              to={dept.to}
              icon={dept.icon}
              label={dept.label}
              count={dept.count}
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
