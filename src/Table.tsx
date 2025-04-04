import React, { useCallback, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  Row,
  SortingState,
} from "@tanstack/react-table";
import { notUndefined, useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  GripVertical,
} from "lucide-react";

// Import shadcn UI components
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { restrictToParentElement } from "@dnd-kit/modifiers";

interface DraggableVirtualTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onReorder?: (newData: T[]) => void;
  showHeaders?: boolean;
  showFooters?: boolean;
  showSortableColumn?: boolean;
}

interface SortableRowProps<T> {
  row: Row<T>;
  children: React.ReactNode;
  className?: string;
  showSortableColumn?: boolean;
}

function SortableRow<
  T extends Record<string, unknown> & { id: string | number }
>({
  row,
  children,
  className,
  showSortableColumn = true,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={className}>
      {children}
      {showSortableColumn && (
        <TableCell className="w-10 p-0">
          <div
            className="flex h-full w-full cursor-grab items-center justify-center"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 50,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
        delay: 20,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && onReorder) {
        const activeIndex = data.findIndex((item) => item.id === active.id);
        const overIndex = data.findIndex((item) => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) return;

        const newData = [...data];
        newData.splice(activeIndex, 1);
        newData.splice(overIndex, 0, data[activeIndex]);
        onReorder(newData);
      }
    },
    [data, onReorder]
  );

  const virtualItems = rowVirtualizer.getVirtualItems();

  const [before, after] =
    virtualItems.length > 0
      ? [
          notUndefined(virtualItems[0]).start -
            rowVirtualizer.options.scrollMargin,
          rowVirtualizer.getTotalSize() -
            notUndefined(virtualItems[virtualItems.length - 1]).end,
        ]
      : [0, 0];

  return (
    <div
      ref={parentRef}
      style={{ contain: "strict", overflowAnchor: "none" }}
      className="h-full overflow-auto"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
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
                                    asc: (
                                      <ArrowUpWideNarrow className="size-4" />
                                    ),
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
            {before > 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  style={{ height: `${before}px` }}
                />
              </TableRow>
            )}
            <SortableContext
              items={data.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <SortableRow
                    key={row.id}
                    row={row}
                    showSortableColumn={showSortableColumn}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </SortableRow>
                );
              })}
            </SortableContext>
            {after > 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  style={{ height: `${after}px` }}
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
      </DndContext>
    </div>
  );
}
