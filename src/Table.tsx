import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { ReactSortable } from "react-sortablejs";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  GripVertical,
} from "lucide-react";

// Import shadcn UI components
import {
  Table,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

interface DraggableVirtualTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onReorder?: (newData: T[]) => void;
  showHeaders?: boolean;
  showFooters?: boolean;
  showSortableColumn?: boolean;
}

export default function DraggableVirtualTable<
  T extends Record<string, unknown> & { id: string | number }
>({
  columns,
  data,
  onReorder,
  showHeaders = true,
  showFooters = false,
  showSortableColumn = true,
}: DraggableVirtualTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
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

  const parentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      style={{ contain: "strict", overflowAnchor: "none" }}
      className="h-full overflow-auto"
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
        <ReactSortable
          tag="tbody"
          list={data}
          setList={onReorder}
          handle=".drag-handle"
          className="sortable-list"
          animation={150}
          ghostClass="sortable-ghost"
          chosenClass="sortable-chosen"
        >
          {rows.map((row) => {
            return (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    style={{ width: cell.column.getSize() }}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                {showSortableColumn && (
                  <TableCell className="w-10 p-0">
                    <div className="flex h-full w-full cursor-grab items-center justify-center drag-handle">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </ReactSortable>
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
