import React, { useState } from "react";
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

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { TableVirtuoso } from "react-virtuoso";
import {
  closestCenter,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "./lib/utils";
import { createPortal } from "react-dom";

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
}: VirtualizedDraggableTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeId, setActiveId] = useState<number>();

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
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      onReorder?.(arrayMove(data, oldIndex, newIndex));
    }

    setActiveId(undefined);
  };

  const dataIds = rows.map((row) => row.original.id);

  return (
    <div className="h-full w-full border rounded-md">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        sensors={sensors}
        onDragStart={({ active }) => {
          setActiveId(active.id as number);
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(undefined)}
      >
        <SortableContext strategy={verticalListSortingStrategy} items={dataIds}>
          <TableVirtuoso
            className="h-full w-full"
            totalCount={rows.length}
            overscan={25}
            components={{
              Table: (props) => <Table {...props} />,
              TableHead: (props) => {
                if (showHeaders) {
                  return <TableHeader className="bg-muted" {...props} />;
                }
                return null;
              },
              TableBody: React.forwardRef((props, ref) => {
                return <TableBody ref={ref} {...props} />;
              }),
              TableRow: ({ ...props }) => {
                const {
                  attributes,
                  listeners,
                  setNodeRef,
                  transform,
                  transition,
                  isDragging,
                } = useSortable({
                  id: rows[props["data-index"]].original.id,
                  animateLayoutChanges: () => true,
                });
                const index = props["data-index"];
                const row = rows[index];
                const style: React.CSSProperties = {
                  transform: CSS.Transform.toString(transform),
                  transition,
                  cursor: isDragging ? "grabbing" : "default",
                };

                return (
                  <TableRow
                    {...props}
                    ref={setNodeRef}
                    style={style}
                    className={cn(
                      "hover:bg-muted/50",
                      isDragging && "cursor-grabbing"
                    )}
                    data-index={index}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    {showSortableColumn && (
                      <TableCell style={{ width: 10 }}>
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
              },
              TableFoot: (props) => {
                if (showFooters) {
                  return <TableFooter {...props} />;
                }
                return null;
              },
            }}
            fixedHeaderContent={() => {
              return table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const ableToSort = header.column.columnDef.enableSorting;
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="border-b"
                        onClick={
                          ableToSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex flex-row items-center gap-2">
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
                    );
                  })}
                  {showSortableColumn && (
                    <TableHead style={{ width: 10 }} className="border-b" />
                  )}
                </TableRow>
              ));
            }}
            fixedFooterContent={() => {
              return table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <TableHead className="border-t" key={header.id}>
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                  {showSortableColumn && (
                    <TableHead style={{ width: 10 }} className="border-t" />
                  )}
                </TableRow>
              ));
            }}
          />
        </SortableContext>
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {rows.find((row) => row.original.id === activeId) ? (
              <Table>
                <TableBody>
                  <TableRow>
                    {rows
                      .find((row) => row.original.id === activeId)
                      ?.getVisibleCells()
                      .map((cell) => (
                        <TableCell
                          style={{
                            width: cell.column.getSize(),
                          }}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    {showSortableColumn && (
                      <TableCell style={{ width: 10 }}>
                        <div className="flex h-full w-full cursor-grab items-center justify-center drag-handle">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}
