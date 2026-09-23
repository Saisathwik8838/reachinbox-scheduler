import React from 'react';

export function Table({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <thead className={`border-b border-gray-100 bg-white ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <tbody className={`divide-y divide-gray-100 bg-white ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}): React.ReactElement {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-gray-50/70 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <th
      scope="col"
      className={`py-3.5 px-6 text-xs font-medium text-gray-500 tracking-normal ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <td className={`py-4 px-6 text-sm text-gray-900 align-middle ${className}`}>
      {children}
    </td>
  );
}
