import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  ComponentProps,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  GripVertical,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

interface VirtualizedDraggableTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onReorder?: (newData: T[]) => void;
  showHeaders?: boolean;
  showFooters?: boolean;
  showSortableColumn?: boolean;
  rowHeight?: number;
  overscan?: number;
}

export default function WindowVirtualizedDraggableTable<
  T extends Record<string, unknown> & { id: string | number }
>({
  columns,
  data,
  onReorder,
  showHeaders = true,
  showFooters = false,
  showSortableColumn = true,
  rowHeight = 40,
  overscan = 10,
}: VirtualizedDraggableTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });
  const { rows } = table.getRowModel();

  // Reset sorting when drag ends to show the new manual order
  const handleDragEnd = useCallback(
    (event: React.DragEvent, rowIndex: number) => {
      const draggedId = event.dataTransfer.getData("text/plain");

      // Find the actual data index, considering we're looking at sorted rows
      const rows = table.getRowModel().rows;
      const draggedSortedIndex = rows.findIndex(
        (row) => String(row.original.id) === draggedId
      );

      if (draggedSortedIndex !== -1 && draggedSortedIndex !== rowIndex) {
        const newData = [...data];

        // Get the actual original indices from the sorted view
        const sourceOriginalIndex = data.findIndex(
          (item) => String(item.id) === draggedId
        );
        const targetOriginalIndex = data.indexOf(rows[rowIndex].original as T);

        // Perform the reordering on the original data
        const [movedItem] = newData.splice(sourceOriginalIndex, 1);
        newData.splice(targetOriginalIndex, 0, movedItem);

        // Clear sorting to show the new manual order
        if (sorting.length) {
          setSorting([]);
        }

        // Update the data
        onReorder?.(newData);
      }
    },
    [data, onReorder, sorting]
  );

  // Create row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Get virtual rows
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{ overflow: "auto", contain: "strict", overflowAnchor: "none" }}
      className="h-full relative border rounded"
    >
      <Table>
        {showHeaders && (
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const ableToSort = header.column.columnDef.enableSorting;
                  return (
                    <React.Fragment key={header.id}>
                      <TableHead
                        style={{ width: header.getSize() }}
                        className={`border-b ${
                          ableToSort ? "cursor-pointer select-none" : ""
                        }`}
                        onClick={
                          ableToSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {ableToSort && (
                              <span>
                                {{
                                  asc: <ArrowUpWideNarrow className="size-4" />,
                                  desc: (
                                    <ArrowDownWideNarrow className="size-4" />
                                  ),
                                }[header.column.getIsSorted() as string] ??
                                  null}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                      {index === headerGroup.headers.length - 1 &&
                        showSortableColumn && (
                          <TableHead style={{ width: 10 }} />
                        )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        )}

        <TableBody>
          {virtualRows.length > 0 && (
            <TableRow>
              <td
                colSpan={columns.length + (showSortableColumn ? 1 : 0)}
                style={{ height: `${virtualRows[0].start}px` }}
              />
            </TableRow>
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                onDrop={(e) => handleDragEnd(e, virtualRow.index)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                {showSortableColumn && (
                  <TableCell className="w-10 p-0">
                    <div
                      className={`flex h-full w-full items-center justify-center ${
                        sorting.length === 0
                          ? "cursor-grab"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {/* Bottom spacer */}
          {virtualRows.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length + (showSortableColumn ? 1 : 0)}
                style={{
                  height: `${
                    rowVirtualizer.getTotalSize() -
                    (virtualRows[virtualRows.length - 1]?.end || 0)
                  }px`,
                }}
              />
            </TableRow>
          )}
        </TableBody>
        {showFooters && (
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
                <TableHead key={footerGroup.id} />
              </TableRow>
            ))}
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
