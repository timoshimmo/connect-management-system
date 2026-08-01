import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FooterLinkProps {
  to: string;
  label: string;
}

export function FooterLink({ to, label }: FooterLinkProps) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
