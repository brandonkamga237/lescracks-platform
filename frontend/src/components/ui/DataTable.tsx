import { cn } from '@/lib/utils';

interface Column<T> {
  /** Column header. Keep it short: these are scanned, not read. */
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  /** Right-align counts so digits line up; tabular figures are applied for you. */
  numeric?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  /**
   * Shows a position column. It counts from the page offset, never from a database id:
   * a row number must not leak how many records exist or invite walking them by guessing.
   */
  offset?: number;
}

function DataTable<T>({ rows, columns, rowKey, offset }: DataTableProps<T>) {
  const numbered = offset !== undefined;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            {numbered && <th className="w-12 px-cell-x py-cell-y text-left text-label text-t4">#</th>}
            {columns.map((c) => (
              <th
                key={c.header}
                className={cn(
                  'px-cell-x py-cell-y text-label text-t4 whitespace-nowrap',
                  c.numeric ? 'text-right' : 'text-left',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row)} className="border-b border-line-soft hover:bg-surface-2 transition-colors">
              {numbered && (
                <td className="px-cell-x py-cell-y text-data text-t4 tabular-nums">{offset + i + 1}</td>
              )}
              {columns.map((c) => (
                <td
                  key={c.header}
                  className={cn(
                    'px-cell-x py-cell-y text-data text-t2 align-middle',
                    c.numeric && 'text-right tabular-nums',
                    c.className,
                  )}
                >
                  {c.cell(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
export type { Column };
