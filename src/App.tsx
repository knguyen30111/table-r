import React, { useState } from "react";
import DraggableVirtualTable from "./Table";
import { ColumnDef } from "@tanstack/react-table";
import SecondDraggableVirtualTable from "./SecondTable";
import ThirdVirtualizedDraggableTable from "./ThirdTable";

// Define your data type
type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
  // category: string;
  // subcategory: string;
};

// Sample data - generate more data for virtualization demo
const generateData = (count: number): Person[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: index + 1,
    firstName: `First${index + 1}`,
    lastName: `Last${index + 1}`,
    age: 20 + Math.floor(Math.random() * 50),
    visits: Math.floor(Math.random() * 100),
    status: ["Active", "Pending", "Inactive"][Math.floor(Math.random() * 3)],
    progress: Math.floor(Math.random() * 100),
    // category: ["Category1", "Category2", "Category3"][
    //   Math.floor(Math.random() * 3)
    // ],
    // subcategory: ["Subcategory1", "Subcategory2", "Subcategory3"][
    //   Math.floor(Math.random() * 3)
    // ],
  }));
};

// Define your columns
const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 60,
  },
  // {
  //   accessorKey: "category",
  //   header: "Category",
  //   enableSorting: true,
  // },
  // {
  //   accessorKey: "subcategory",
  //   header: "Subcategory",
  //   enableSorting: true,
  // },
  {
    accessorKey: "firstName",
    header: "First Name",
    enableSorting: true,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "age",
    header: "Age",
    size: 80,
  },
  {
    accessorKey: "visits",
    header: "Visits",
    size: 80,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center">
          <div
            className={`h-2 w-2 rounded-full mr-2 ${
              status === "Active"
                ? "bg-green-500"
                : status === "Pending"
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          />
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "progress",
    header: "Profile Progress",
    cell: ({ row }) => {
      const progress = row.original.progress;
      return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              progress > 66
                ? "bg-green-600"
                : progress > 33
                ? "bg-yellow-500"
                : "bg-red-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      );
    },
  },
];

export default function App() {
  const [data, setData] = useState(generateData(200));
  const [toggle, setToggle] = useState(true);

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-2">Draggable Virtual Table</h1>
      <p className="mb-4 text-gray-500">
        Drag rows to reorder. The table is virtualized for performance with 1000
        rows.
      </p>

      <button onClick={() => setToggle(!toggle)}>Toggle</button>
      {/* Parent container with fixed height */}
      <div className="flex-1 border rounded-md overflow-hidden">
        <ThirdVirtualizedDraggableTable
          columns={columns}
          data={data}
          onReorder={setData}
          showSortableColumn={toggle}
        />
      </div>
    </div>
  );
}
