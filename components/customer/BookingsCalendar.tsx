"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone, Mic, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface BookingCall {
  id: string;
  startedAt: Date;
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
  return new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
    const day = new Date(b.startedAt).getDate();
    byDay.set(day, [...(byDay.get(day) ?? []), b]);
  }

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
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

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 capitalize">{monthLabel}</h2>
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

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-l border-t border-gray-100">
        {cells.map((day, i) => {
          const dayBookings = day ? (byDay.get(day) ?? []) : [];
          const isToday = isCurrentMonth && day === now.getDate();
          return (
            <div key={i} className={`min-h-[90px] border-r border-b border-gray-100 p-1.5 flex flex-col ${!day ? "bg-gray-50/50" : ""}`}>
              {day && (
                <>
                  <span className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full self-center ${isToday ? "bg-black text-white" : "text-gray-500"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 2).map((b) => (
                      <button key={b.id} onClick={() => setSelected(b)}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition truncate">
                        {formatTime(b.startedAt)} {b.fromNumber ?? "–"}
                      </button>
                    ))}
                    {dayBookings.length > 2 && (
                      <button onClick={() => setSelected(dayBookings[2])}
                        className="text-xs text-gray-400 hover:text-gray-600 pl-1">
                        +{dayBookings.length - 2} weitere
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Buchung</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { icon: Calendar, label: "Zeitpunkt", value: formatDateTime(selected.startedAt) },
                { icon: Phone, label: "Anrufer", value: selected.fromNumber ?? "–" },
                { icon: Mic, label: "Assistent", value: selected.assistant?.name ?? "–" },
                { icon: Clock, label: "Dauer", value: selected.durationSec ? formatDuration(selected.durationSec) : "–" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
              <Badge variant="green">Gebucht</Badge>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
