"use client";

import { Printer } from "lucide-react";

export default function LaunchKitPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 print:hidden"
    >
      <Printer className="h-4 w-4" />
      <span>Print or save PDF</span>
    </button>
  );
}
