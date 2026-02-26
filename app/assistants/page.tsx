"use client";

import { MoreHorizontal } from "lucide-react";

export default function AssistantsPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">
          Assistenten
        </h1>

        <button className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-80 transition">
          Assistent erstellen
        </button>
      </div>

      {/* Suche */}
      <div>
        <input
          type="text"
          placeholder="Suche"
          className="w-full md:w-96 px-5 py-3 rounded-xl border border-gray-300 bg-white text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        {/* Tabellen Header */}
        <div className="grid grid-cols-3 px-6 py-4 border-b text-sm font-semibold text-gray-600">
          <div>Name</div>
          <div>Telefonnummer</div>
          <div></div>
        </div>

        {/* Leerer Zustand */}
        <div className="flex items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>

            <div>
              <p className="font-medium text-black">
                Kein Assistent
              </p>
              <p className="text-sm text-gray-500">
                Keine Telefonnummer
              </p>
            </div>
          </div>

          <button className="p-2 rounded-lg hover:bg-gray-100 transition">
            <MoreHorizontal size={20} />
          </button>

        </div>

      </div>

    </div>
  );
}