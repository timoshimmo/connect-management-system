import {
  PenLine,
  Eye,
  ShieldCheck,
  Settings2,
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

const roles = [
  {
    to: '/login?role=author',
    icon: PenLine,
    label: 'Author',
    description: 'Create and submit documents',
  },
  {
    to: '/login?role=reviewer',
    icon: Eye,
    label: 'Reviewer',
    description: 'Review submitted content',
  },
  {
    to: '/login?role=approver',
    icon: ShieldCheck,
    label: 'Approver',
    description: 'Approve for publication',
  },
  {
    to: '/login?role=controller',
    icon: Settings2,
    label: 'Controller',
    description: 'Manage publishing workflow',
  },
];

export function MSPublishingCard() {
  return (
    <Card hover className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                MS Publishing
              </h3>
              <Badge variant="new">New</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Role-based document publishing and approval workflows
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex-1">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {roles.map((role) => (
            <RoleLink
              key={role.label}
              to={role.to}
              icon={role.icon}
              label={role.label}
              description={role.description}
            />
          ))}
        </div>
      </CardBody>

      <CardFooter>
        <FooterLink to="/login" label="Open MS Publishing" />
      </CardFooter>
    </Card>
  );
}
