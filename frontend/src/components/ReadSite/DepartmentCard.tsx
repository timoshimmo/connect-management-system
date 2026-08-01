import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { departmentIconMap } from './departmentIconMap';

/**
 * A single department tile shown in the "Browse by Department" grid.
 * Acts as a button so keyboard and screen reader users can filter by
 * department the same way a mouse user clicking the card would.
 */
export interface Department {
  id: string;
  icon: string;
  name: string;
  documentCount: number;
}

interface DepartmentCardProps {
  department: Department;
  onSelect: (department: Department) => void;
}

export default function DepartmentCard({ department, onSelect }: DepartmentCardProps) {
  const Icon = (departmentIconMap as Record<string, ComponentType<{ className?: string; 'aria-hidden'?: string }>>)[
    department.icon
  ];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(department)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
        {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">
          {department.name}
        </span>
        <span className="block text-xs text-gray-500">
          {department.documentCount} documents
        </span>
      </span>
    </motion.button>
  );
}
