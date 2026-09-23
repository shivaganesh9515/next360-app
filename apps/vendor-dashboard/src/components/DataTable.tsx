'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Inbox, Clock, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  /** Hide on screens smaller than this breakpoint. 'sm' = hide below 640px */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  recentSearches?: string[];
  onClearRecent?: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, loading, searchable, onSearch, recentSearches, onClearRecent,
  page = 1, totalPages = 1, onPageChange, onRowClick, emptyMessage = 'No data found'
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    onSearch?.(val);
    if (val.trim()) setShowRecent(false);
  };

  const selectRecent = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
    setShowRecent(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="relative max-w-sm" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (recentSearches && recentSearches.length > 0 && !searchQuery) setShowRecent(true); }}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {showRecent && recentSearches && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-medium text-slate-500">Recent searches</span>
                  {onClearRecent && (
                    <button onClick={onClearRecent} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                  )}
                </div>
                {recentSearches.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectRecent(query)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{query}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto -mx-px">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-xs font-medium text-slate-500 uppercase tracking-wider ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-10 h-10 text-slate-300" />
                    <p className="text-sm text-slate-400">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow
                  key={item.id || idx}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`text-sm text-slate-700 ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
