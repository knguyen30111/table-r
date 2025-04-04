/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Add custom styles for sortable
      styles: {
        ".sortable-ghost": {
          opacity: "0.5",
          background: "#f8fafc",
        },
        ".sortable-chosen": {
          background: "#f1f5f9",
        },
        ".drag-handle": {
          cursor: "grab",
        },
        ".drag-handle:active": {
          cursor: "grabbing",
        },
      },
    },
  },
  plugins: [],
};
