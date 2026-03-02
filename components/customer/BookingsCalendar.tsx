"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, Mic, Clock, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface BookingCall {
  id: string;
  bookingDate: Date | null;
  startedAt: Date;
  customerName: string | null;
  fromNumber: string | null;
  durationSec: number | null;
  assistant: { name: string } | null;
}

interface Props {
  year: number;
  month: number; // 1-based
  bookings: BookingCall[];
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")} Min`;
}

export function BookingsCalendar({ year, month, bookings }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<BookingCall | null>(null);

  const byDay = new Map<number, BookingCall[]>();
  for (const b of bookings) {
    if (!b.bookingDate) continue;
    const day = new Date(b.bookingDate).getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), b]);
  }

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday-first: Sunday=0 becomes 6, Mon=1 becomes 0, etc.
  const startWeekday = (firstDay.getDay() + 6) % 7;

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    router.push(`/app/calendar?month=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthLabel = firstDay.toLocaleString("de-DE", { month: "long", year: "numeric" });
  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = cells.length / 7;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {!isCurrentMonth && (
            <Button variant="secondary" size="sm" onClick={() => navigate(0)}>
              Heute
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="w-full" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {/* Weekday headers */}
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-2 border-b border-gray-100 dark:border-gray-800">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          const dayBookings = day ? (byDay.get(day) ?? []) : [];
          const isToday = isCurrentMonth && day === now.getDate();
          const colIndex = i % 7;
          const isWeekend = colIndex >= 5;
          return (
            <div
              key={i}
              className={[
                "border-b border-r border-gray-100 dark:border-gray-800 p-1.5 flex flex-col",
                // first cell in each row gets left border
                colIndex === 0 ? "border-l border-gray-100 dark:border-gray-800" : "",
                !day
                  ? "bg-gray-50/60 dark:bg-gray-800/20"
                  : isWeekend
                  ? "bg-gray-50/40 dark:bg-gray-800/10"
                  : "bg-white dark:bg-gray-900",
              ].join(" ")}
              style={{ minHeight: `${Math.round(400 / rows)}px` }}
            >
              {day && (
                <>
                  <span className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full self-start ${
                    isToday
                      ? "bg-black dark:bg-white text-white dark:text-gray-900 font-bold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-0.5 flex-1">
                    {dayBookings.slice(0, 2).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition truncate"
                      >
                        {b.bookingDate && formatTime(b.bookingDate)}{" "}
                        {b.customerName ?? "Buchung"}
                      </button>
                    ))}
                    {dayBookings.length > 2 && (
                      <button
                        onClick={() => setSelected(dayBookings[2])}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 pl-1"
                      >
                        +{dayBookings.length - 2} mehr
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {bookings.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Keine Buchungen in diesem Monat</p>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Buchungsdetails</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { icon: Calendar, label: "Termin", value: selected.bookingDate ? formatDateTime(selected.bookingDate) : "–" },
                { icon: User, label: "Kunde", value: selected.customerName ?? selected.fromNumber ?? "–" },
                { icon: Mic, label: "Assistent", value: selected.assistant?.name ?? "–" },
                { icon: Clock, label: "Gesprächsdauer", value: selected.durationSec ? formatDuration(selected.durationSec) : "–" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <Badge variant="green">Gebucht</Badge>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
