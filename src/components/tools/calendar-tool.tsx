"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Milestone as MilestoneIcon,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Users,
  Lock,
  LayoutDashboard,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarEvent {
  id: string;
  type: "event" | "milestone";
  date: Date;
  time?: string;
  title: string;
  description: string;
}

interface CalendarToolProps {
  prompt: string;
  onSubmit: (content: {
    events: CalendarEvent[];
    view: string;
    timestamp: number;
  }) => void;
  initialContent?: { events: CalendarEvent[]; view: string; timestamp: number };
  isSubmitting?: boolean;
  isStandalone?: boolean;
  kanbanData?: {
    cards: Array<{ id: string; title: string; column: "todo" | "inprogress" | "done"; updatedAt?: number }>;
    timestamp: number;
  } | null;
  journalData?: {
    entries: Array<{ id: string; title: string; entry: string; timestamp: number; sharedWithTeam: boolean }>;
    timestamp: number;
  } | null;
}

export function CalendarTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
  isStandalone,
  kanbanData,
  journalData,
}: CalendarToolProps) {
  const [view, setView] = useState<"week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(
    initialContent?.events?.map((e) => ({ ...e, date: new Date(e.date) })) ||
      [],
  );

  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineDate, setOutlineDate] = useState<Date | null>(null);

  useEffect(() => {
    if (initialContent?.events) {
      setEvents(initialContent.events.map((e) => ({ ...e, date: new Date(e.date) })));
    }
  }, [initialContent]);

  // Form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    date: new Date(),
    time: "",
    title: "",
    description: "",
  });
  const [milestoneFormData, setMilestoneFormData] = useState({
    date: new Date(),
    title: "",
    description: "",
  });

  // Sync dates when selectedDate changes so new forms pre-populate correctly
  useEffect(() => {
    setEventFormData((prev) => ({ ...prev, date: selectedDate }));
    setMilestoneFormData((prev) => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  const addEvent = () => {
    if (!eventFormData.title.trim()) return;

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "event",
      date: eventFormData.date,
      time: eventFormData.time,
      title: eventFormData.title.trim(),
      description: eventFormData.description.trim(),
    };

    setEvents([...events, newEvent]);
    setEventFormData({
      date: selectedDate,
      time: "",
      title: "",
      description: "",
    });
    setShowEventForm(false);
  };

  const addMilestone = () => {
    if (!milestoneFormData.title.trim()) return;

    const newMilestone: CalendarEvent = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "milestone",
      date: milestoneFormData.date,
      title: milestoneFormData.title.trim(),
      description: milestoneFormData.description.trim(),
    };

    setEvents([...events, newMilestone]);
    setMilestoneFormData({ date: selectedDate, title: "", description: "" });
    setShowMilestoneForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const getItemsForDate = (date: Date) => {
    const dayEvents = events.filter((e) => isSameDay(e.date, date));
    
    const dayJournals = journalData?.entries
      ? journalData.entries.filter((entry) => isSameDay(new Date(entry.timestamp), date))
      : [];
      
    const dayKanbans = kanbanData?.cards
      ? kanbanData.cards.filter((card) => {
          const cardTime = card.updatedAt || kanbanData.timestamp;
          return isSameDay(new Date(cardTime), date);
        })
      : [];

    return {
      events: dayEvents,
      journals: dayJournals,
      kanban: dayKanbans,
      totalCount: dayEvents.length + dayJournals.length + dayKanbans.length
    };
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setOutlineDate(day);
    setIsOutlineOpen(true);
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const handleSubmit = () => {
    if (events.length === 0) return;
    onSubmit({
      events,
      view,
      timestamp: Date.now(),
    });
  };

  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return (
    <div className="space-y-3">
      {/* Premium Header - Super Compact */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 shadow-lg flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-400 leading-none">
            {format(selectedDate, "EEEE")}
          </p>
          <h2 className="text-base font-black text-white tracking-tight mt-1 leading-none">
            {format(selectedDate, "MMMM d, yyyy")}
          </h2>
        </div>
        <CalendarIcon className="w-5 h-5 text-indigo-400 shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "week" | "month")}
            className="bg-black/20 p-0.5 rounded-lg border border-white/5"
          >
            <TabsList className="bg-transparent h-7">
              <TabsTrigger value="week" className="text-[9px] uppercase font-black px-2.5 h-6 rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-[9px] uppercase font-black px-2.5 h-6 rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
          {events.length} {events.length === 1 ? "Item" : "Items"}
        </div>
      </div>

      {/* Calendar Display */}
      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
        {view === "month" ? (
          <div className="p-2.5">
            {/* Custom Month Header */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                {format(selectedDate, "MMMM yyyy")}
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  className="h-6 w-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button 
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  className="h-6 w-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1.5">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const start = startOfMonth(selectedDate);
                const end = endOfMonth(selectedDate);
                const startDay = startOfWeek(start);
                const endDay = endOfWeek(end);
                const days = eachDayOfInterval({ start: startDay, end: endDay });

                return days.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  
                  const dayItems = getItemsForDate(day);
                  const allItems = [
                    ...dayItems.events.map(e => ({ id: e.id, title: e.title, type: "event" })),
                    ...dayItems.kanban.map(k => ({ id: k.id, title: k.title, type: "kanban" })),
                    ...dayItems.journals.map(j => ({ id: j.id, title: j.title || "Untitled Entry", type: "journal" }))
                  ];

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "min-h-[64px] w-full rounded-lg flex flex-col items-stretch justify-between p-1.5 text-xs font-bold transition-all duration-200 relative border text-left select-none overflow-hidden",
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10 z-10"
                          : isToday
                            ? "bg-indigo-500/5 border border-indigo-500/20 text-indigo-400"
                            : isCurrentMonth
                              ? "bg-white/[0.01] border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-300"
                              : "border-transparent text-slate-700 opacity-20 hover:opacity-40"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                          isToday && "bg-indigo-500 text-white font-black"
                        )}>
                          {format(day, "d")}
                        </span>
                        {allItems.length > 0 && !isCurrentMonth && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                        )}
                      </div>

                      {isCurrentMonth && allItems.length > 0 && (
                        <div className="flex-1 flex flex-col gap-0.5 mt-1 justify-end w-full overflow-hidden">
                          {allItems.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                "text-[8px] px-1 py-0.5 rounded truncate font-bold uppercase tracking-wider leading-none w-full border",
                                item.type === "event"
                                  ? "bg-indigo-500/15 border-indigo-500/20 text-indigo-300"
                                  : item.type === "kanban"
                                    ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-300"
                                    : "bg-violet-500/15 border-violet-500/20 text-violet-300"
                              )}
                            >
                              {item.title}
                            </div>
                          ))}
                          {allItems.length > 2 && (
                            <div className="text-[7.5px] text-zinc-500 font-bold pl-0.5 leading-none">
                              +{allItems.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="p-2.5 space-y-2">
            <div className="text-center text-[9px] font-black uppercase tracking-widest text-indigo-400/60 pb-1.5 border-b border-white/5">
              Week of {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "MMM d, yyyy")}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getWeekDays().map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                const dayItems = getItemsForDate(day);
                const allItems = [
                  ...dayItems.events.map(e => ({ id: e.id, type: "event" })),
                  ...dayItems.kanban.map(k => ({ id: k.id, type: "kanban" })),
                  ...dayItems.journals.map(j => ({ id: j.id, type: "journal" }))
                ];

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "flex flex-col items-center py-2 rounded-lg cursor-pointer transition-all duration-300 border select-none",
                      isSelected
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 z-10"
                        : isToday
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400"
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className="text-[7.5px] font-black uppercase tracking-wider mb-0.5 opacity-60">
                      {format(day, "EEE")}
                    </span>
                    <span className="text-xs font-black">
                      {format(day, "d")}
                    </span>
                    {allItems.length > 0 && (
                      <div className="mt-1 flex gap-0.5 flex-wrap justify-center max-w-full px-0.5">
                        {allItems.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.type === "event" 
                                ? "bg-indigo-400" 
                                : item.type === "kanban" 
                                  ? "bg-emerald-400" 
                                  : "bg-violet-400"
                            )}
                          />
                        ))}
                        {allItems.length > 4 && (
                          <div className="w-1 h-1 rounded-full bg-slate-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowEventForm(!showEventForm);
            setShowMilestoneForm(false);
          }}
          className={cn(
            "flex-1 h-8 rounded-lg border-white/5 bg-white/5 font-black uppercase text-[9px] tracking-widest transition-all",
            showEventForm ? "bg-indigo-500 text-white border-indigo-500" : "hover:bg-white/10 text-slate-400"
          )}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Event
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowMilestoneForm(!showMilestoneForm);
            setShowEventForm(false);
          }}
          className={cn(
            "flex-1 h-8 rounded-lg border-white/5 bg-white/5 font-black uppercase text-[9px] tracking-widest transition-all",
            showMilestoneForm ? "bg-amber-500 text-white border-amber-500" : "hover:bg-white/10 text-slate-400"
          )}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Milestone
        </Button>
      </div>

      {/* Forms and Lists */}
      <div className="space-y-2">
        {/* Event Form */}
        {showEventForm && (
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">New Event for {format(eventFormData.date, "MMM d")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Time</Label>
                <Input
                  type="time"
                  value={eventFormData.time}
                  onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                  className="bg-black/20 border-white/10 h-8 text-xs rounded-md"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Title</Label>
                <Input
                  placeholder="Event title..."
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  className="bg-black/20 border-white/10 h-8 text-xs rounded-md"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</Label>
              <Textarea
                placeholder="Details..."
                value={eventFormData.description}
                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                className="bg-black/20 border-white/10 text-xs rounded-md min-h-[50px] py-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addEvent} disabled={!eventFormData.title.trim()} className="flex-1 bg-indigo-500 hover:bg-indigo-600 h-8 text-xs font-bold rounded-md">Create Event</Button>
              <Button variant="ghost" onClick={() => setShowEventForm(false)} className="text-xs font-bold h-8 rounded-md">Cancel</Button>
            </div>
          </div>
        )}

        {/* Milestone Form */}
        {showMilestoneForm && (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <MilestoneIcon className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">New Milestone for {format(milestoneFormData.date, "MMM d")}</h3>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Title</Label>
              <Input
                placeholder="Milestone title..."
                value={milestoneFormData.title}
                onChange={(e) => setMilestoneFormData({ ...milestoneFormData, title: e.target.value })}
                className="bg-black/20 border-white/10 h-8 text-xs rounded-md"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</Label>
              <Textarea
                placeholder="Details..."
                value={milestoneFormData.description}
                onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                className="bg-black/20 border-white/10 text-xs rounded-md min-h-[50px] py-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addMilestone} disabled={!milestoneFormData.title.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 h-8 text-xs font-bold rounded-md text-black">Create Milestone</Button>
              <Button variant="ghost" onClick={() => setShowMilestoneForm(false)} className="text-xs font-bold h-8 rounded-md">Cancel</Button>
            </div>
          </div>
        )}

        {/* Events and Milestones List */}
        {sortedEvents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Scheduled Items</h4>
              <div className="h-px flex-1 bg-white/5 mx-3" />
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
              {sortedEvents.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-2.5 rounded-lg border transition-all hover:scale-[1.01]",
                    item.type === "event"
                      ? "bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30"
                      : "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {item.type === "event" ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                        )}
                        <span className="text-xs font-bold text-white leading-tight">{item.title}</span>
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <span>{format(item.date, "MMM d")}</span>
                        {item.time && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>{item.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      onClick={() => deleteEvent(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Section */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <Button
            onClick={handleSubmit}
            disabled={events.length === 0 || isSubmitting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white h-10 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {isStandalone ? `Save Plan (${events.length})` : `Submit Plan (${events.length})`}
              </>
            )}
          </Button>

          {events.length === 0 && (
            <p className="text-[8px] text-center text-slate-600 font-bold uppercase tracking-widest">
              Add at least one item to proceed
            </p>
          )}
        </div>
      </div>

      {/* Registry Outline Popup Modal */}
      <AnimatePresence>
        {isOutlineOpen && outlineDate && (() => {
          const dayItems = getItemsForDate(outlineDate);
          const formattedDate = format(outlineDate, "EEEE, MMMM d, yyyy");
          
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOutlineOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-lg bg-[#0D111A]/98 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col max-h-[80vh] gap-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-400">
                      Date Outline
                    </p>
                    <h3 className="text-md font-bold text-white">
                      {formattedDate}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOutlineOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Outline content list (scrolling area) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                  {/* Calendar Scheduled Events & Milestones */}
                  {dayItems.events.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Calendar &amp; Syncs ({dayItems.events.length})
                      </h4>
                      <div className="space-y-1.5">
                        {dayItems.events.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 border rounded-xl bg-indigo-950/20 border-indigo-500/20"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  {item.type === "event" ? (
                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <MilestoneIcon className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                  {item.title}
                                </h5>
                                {item.description && (
                                  <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              {item.time && (
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                                  {item.time}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kanban Board Task Updates */}
                  {dayItems.kanban.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                        Kanban Tasks ({dayItems.kanban.length})
                      </h4>
                      <div className="space-y-1.5">
                        {dayItems.kanban.map((card) => (
                          <div
                            key={card.id}
                            className="p-3 border border-emerald-500/20 bg-emerald-950/10 rounded-xl flex items-center justify-between gap-3"
                          >
                            <span className="text-xs font-bold text-white">{card.title}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border leading-none shrink-0",
                              card.column === "done" 
                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                                : card.column === "inprogress"
                                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                                  : "bg-zinc-500/20 border-zinc-500/30 text-zinc-400"
                            )}>
                              {card.column === "done" ? "Done" : card.column === "inprogress" ? "In Progress" : "Todo"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Journal Logs */}
                  {dayItems.journals.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                        Journal Entries ({dayItems.journals.length})
                      </h4>
                      <div className="space-y-1.5">
                        {dayItems.journals.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 border border-violet-500/20 bg-violet-950/10 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-white">{entry.title || "Untitled Entry"}</h5>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                {entry.sharedWithTeam ? (
                                  <Users className="w-3 h-3 text-violet-400" />
                                ) : (
                                  <Lock className="w-3 h-3" />
                                )}
                                <span>{entry.sharedWithTeam ? "Shared" : "Private"}</span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed bg-[#121824] p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                              {entry.entry}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {dayItems.totalCount === 0 && (
                    <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                      <div className="p-4 rounded-full bg-white/5 text-slate-500 animate-pulse">
                        <CalendarIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">No items logged on this date</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Click "Event" or "Milestone" below to schedule an activity.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick actions for this date inside modal */}
                <div className="flex gap-2 pt-3.5 border-t border-white/10">
                  <Button
                    onClick={() => {
                      setEventFormData((prev) => ({ ...prev, date: outlineDate }));
                      setShowEventForm(true);
                      setShowMilestoneForm(false);
                      setIsOutlineOpen(false);
                    }}
                    size="sm"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setMilestoneFormData((prev) => ({ ...prev, date: outlineDate }));
                      setShowMilestoneForm(true);
                      setShowEventForm(false);
                      setIsOutlineOpen(false);
                    }}
                    size="sm"
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Milestone</span>
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
