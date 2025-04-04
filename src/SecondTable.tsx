import React, { PropsWithChildren, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  GripVertical,
} from "lucide-react";
import { cn } from "./lib/utils";

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

function SortableRow<T extends { id: string | number }>({
  row,
  showSortableColumn,
  children,
}: PropsWithChildren<{
  row: Row<T>;
  showSortableColumn: boolean;
}>) {
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn("hover:bg-muted/50", isDragging && "cursor-grabbing")}
    >
      {children}
      {showSortableColumn && (
        <TableCell className="w-10 p-0">
          <div
            className="flex h-full w-full cursor-grab items-center justify-center drag-handle"
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

export default function SecondDraggableVirtualTable<
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      const newData = [...data];
      newData.splice(oldIndex, 1);
      newData.splice(newIndex, 0, data[oldIndex]);
      onReorder?.(newData);
    }
  };

  return (
    <div
      ref={parentRef}
      style={{ contain: "strict", overflowAnchor: "none" }}
      className="h-full overflow-auto"
    >
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        sensors={sensors}
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
            <SortableContext
              items={rows.map((row) => row.original.id)}
              strategy={verticalListSortingStrategy}
            >
              {rows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  showSortableColumn={showSortableColumn}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      style={{ width: cell.column.getSize() }}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </SortableRow>
              ))}
            </SortableContext>
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
