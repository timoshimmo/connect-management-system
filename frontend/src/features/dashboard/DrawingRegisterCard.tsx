import { Search, Eye, Lock } from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FooterLink,
  RoleLink,
} from '@/components/ui';

const features = [
  {
    to: '/drawing-register/login',
    icon: Search,
    label: 'Search & Browse',
    description: 'Find published documents by department or type',
  },
  {
    to: '/drawing-register/login',
    icon: Eye,
    label: 'Preview & Download',
    description: 'View and download without leaving the browser',
  },
  {
    to: '/drawing-register/login',
    icon: Lock,
    label: 'Sign-In Required',
    description: 'A separate account from MS Publishing',
  },
];

export function DrawingRegisterCard() {
  return (
    <Card hover className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">STAC Drawing Register</h3>
              <Badge variant="new">New</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Browse published engineering documents — sign in required
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex-1">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {features.map((feature) => (
            <RoleLink
              key={feature.label}
              to={feature.to}
              icon={feature.icon}
              label={feature.label}
              description={feature.description}
            />
          ))}
        </div>
      </CardBody>

      <CardFooter>
        <FooterLink to="/drawing-register/login" label="Open Drawing Register" />
      </CardFooter>
    </Card>
  );
}
