import {
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_PAGE_SIZE = 10;
const MAX_VISIBLE_PAGES = 5;

type DataTableProps<T> = {
    data: T[];
    columns: { key: string; label: string; render?: (item: T) => ReactNode }[];
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSearchApply: () => void;
    page: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    totalCount: number;
    emptyMessage?: string;
    keyExtractor: (item: T) => string;
    className?: string;
    actions?: ReactNode;
};

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= MAX_VISIBLE_PAGES) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + MAX_VISIBLE_PAGES - 1);
    if (end - start + 1 < MAX_VISIBLE_PAGES) {
        start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('ellipsis');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
        if (end < total - 1) pages.push('ellipsis');
        pages.push(total);
    }
    return pages;
}

export function DataTable<T>({
    data,
    columns,
    searchPlaceholder = 'Search…',
    searchValue,
    onSearchChange,
    onSearchApply,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    onPageChange,
    totalCount,
    emptyMessage = 'No items found.',
    keyExtractor,
    className,
    actions,
}: DataTableProps<T>) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);
    const pageNumbers = getPageNumbers(page, totalPages);

    return (
        <div
            className={cn(
                'flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm',
                className
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2 sm:max-w-md">
                    <div className="relative flex-1 sm:flex-initial">
                        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearchApply()}
                            className="h-9 pl-9 pr-2"
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="h-9 shrink-0"
                        onClick={onSearchApply}
                    >
                        <SearchIcon className="size-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Search</span>
                    </Button>
                </div>
                {actions}
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/60">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="h-11 px-4 text-left font-semibold text-foreground"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-muted-foreground h-28 text-center"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr
                                        key={keyExtractor(item)}
                                        className={cn(
                                            'border-b border-border/80 transition-colors last:border-b-0',
                                            idx % 2 === 0
                                                ? 'bg-card'
                                                : 'bg-muted/20',
                                            'hover:bg-muted/40'
                                        )}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className="px-4 py-3.5"
                                            >
                                                {col.render
                                                    ? col.render(item)
                                                    : String(
                                                          (item as Record<string, unknown>)[
                                                              col.key
                                                          ] ?? ''
                                                      )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-xs sm:text-sm">
                    {totalCount === 0
                        ? 'No results'
                        : `Showing ${from} to ${to} of ${totalCount} results`}
                </p>
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        <ChevronLeftIcon className="size-4" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <div className="flex items-center gap-0.5">
                        {pageNumbers.map((p, i) =>
                            p === 'ellipsis' ? (
                                <span
                                    key={`ellipsis-${i}`}
                                    className="text-muted-foreground px-1.5 text-sm"
                                >
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={page === p ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-8 min-w-8 px-2"
                                    onClick={() => onPageChange(p)}
                                >
                                    {p}
                                </Button>
                            )
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                    >
                        <ChevronRightIcon className="size-4" />
                        <span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
