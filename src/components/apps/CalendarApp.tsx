"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from "lucide-react";
import { useCalendarStore } from "@/lib/calendarStore";

const ACCENT = "#C8A97E";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarApp() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(today));
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const { events, addEvent, deleteEvent } = useCalendarStore();

  const todayKey = toDateKey(today);

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const getDayKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const eventsMap = useMemo(() => {
    const m: Record<string, number> = {};
    events.forEach((e) => { m[e.date] = (m[e.date] || 0) + 1; });
    return m;
  }, [events]);

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addEvent(selectedDate, newTime, text);
    setNewText("");
  };

  return (
    <div className="flex h-full" style={{ background: "#0A0A0C" }}>
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col p-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-md transition-colors" style={{ color: ACCENT }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-md transition-colors" style={{ color: ACCENT }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[9px] font-mono uppercase tracking-wider py-1" style={{ color: "rgba(200,169,126,0.4)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {grid.map((day, i) => {
            if (day === null) return <div key={i} />;
            const key = getDayKey(day);
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const hasEvents = (eventsMap[key] || 0) > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(key)}
                className="relative flex flex-col items-center justify-center rounded-lg transition-all text-[12px]"
                style={{
                  background: isSelected
                    ? "rgba(200,169,126,0.15)"
                    : "transparent",
                  color: isToday
                    ? ACCENT
                    : isSelected
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.5)",
                  border: isToday
                    ? `1px solid ${ACCENT}`
                    : "1px solid transparent",
                  fontWeight: isToday ? 700 : 400,
                  minHeight: 36,
                }}
              >
                {day}
                {hasEvents && (
                  <div
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: ACCENT }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events panel */}
      <div
        className="w-[220px] shrink-0 flex flex-col border-l"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-mono" style={{ color: ACCENT }}>
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto">
          {selectedEvents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                No events
              </span>
            </div>
          ) : (
            selectedEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-2 px-3 py-2 border-b group"
                style={{ borderColor: "rgba(255,255,255,0.03)" }}
              >
                <Clock size={10} className="mt-0.5 shrink-0" style={{ color: "rgba(200,169,126,0.4)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono" style={{ color: "rgba(200,169,126,0.5)" }}>
                    {ev.time}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {ev.text}
                  </div>
                </div>
                <button
                  onClick={() => deleteEvent(ev.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 shrink-0"
                  style={{ color: "rgba(255,85,87,0.5)" }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add event */}
        <div className="px-3 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-transparent text-[10px] font-mono outline-none w-[72px] px-1.5 py-1 rounded border"
              style={{
                color: "rgba(255,255,255,0.6)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add event..."
              className="flex-1 bg-transparent text-[11px] outline-none px-2 py-1.5 rounded border"
              style={{
                color: "rgba(255,255,255,0.7)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />
            <button
              onClick={handleAdd}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: ACCENT }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
