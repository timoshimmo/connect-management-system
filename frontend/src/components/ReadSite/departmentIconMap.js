import {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  CogIcon,
  CubeIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

/**
 * Maps the icon name stored in department data (src/data/departments.js) to
 * the actual Heroicon component rendered by DepartmentCard. Departments
 * outside the original curated set (e.g. newly created via Department
 * Management) fall back to BuildingOfficeIcon — see defaultDepartmentIcon.
 */
export const departmentIconMap = {
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  CogIcon,
  CubeIcon,
  BuildingOfficeIcon,
};

export const defaultDepartmentIcon = 'BuildingOfficeIcon';
