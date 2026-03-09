import React from "react";

export type SortDir = "asc" | "desc";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  getRowKey: (row: T) => string;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  sortKey,
  sortDir,
  onSort,
  getRowKey,
  emptyText = "No items yet.",
}: Props<T>) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  col.sortable ? "sortable" : "",
                  col.sortable && col.key === sortKey ? "sorted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && (
                  <i className="sort-icon">
                    {col.key === sortKey ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </i>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="table-empty">
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
