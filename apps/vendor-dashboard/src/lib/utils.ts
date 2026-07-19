import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate and download a CSV file from an array of objects.
 * @param data - Array of row objects
 * @param columns - Column definitions with key and label
 * @param filename - Output filename (without extension)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T | string; label: string }[],
  filename: string
) {
  if (data.length === 0) return;

  // Build header row
  const headers = columns.map((c) => JSON.stringify(c.label)).join(',');

  // Build data rows — escape commas and quotes
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key as keyof T];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  const csv = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

