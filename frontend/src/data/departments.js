/**
 * Mock department data for the Management System Read Site.
 * Icon names map to Heroicons components resolved in DepartmentCard.
 * Omega 365 is intentionally excluded — it is a software system, not a department.
 */
export const departments = [
  {
    id: 'compliance',
    name: 'Compliance',
    documentCount: 18,
    icon: 'ShieldCheckIcon',
  },
  {
    id: 'finance',
    name: 'Finance',
    documentCount: 24,
    icon: 'CurrencyDollarIcon',
  },
  {
    id: 'hr',
    name: 'HR',
    documentCount: 31,
    icon: 'UsersIcon',
  },
  {
    id: 'hse',
    name: 'HSE',
    documentCount: 27,
    icon: 'BeakerIcon',
  },
  {
    id: 'it',
    name: 'IT',
    documentCount: 15,
    icon: 'ComputerDesktopIcon',
  },
  {
    id: 'operations-maintenance',
    name: 'Operations & Maintenance',
    documentCount: 22,
    icon: 'CogIcon',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    documentCount: 12,
    icon: 'CubeIcon',
  },
];
