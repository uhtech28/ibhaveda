"use client";

import { CalendarProvider, CalendarDate, CalendarMonthPicker, CalendarYearPicker, CalendarDatePagination, CalendarHeader, CalendarBody, CalendarItem, Feature } from '@/components/ui/kibo-ui/calendar';
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

type CalendarTodoFeature = Feature & {
  ideaTitle: string;
};

export default function TestCalendar() {
  const todos = useQuery(api.todos.getTodosForCalendar) || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Todo Calendar</h1>
      <CalendarProvider>
        <CalendarDate>
          <CalendarMonthPicker />
          <CalendarYearPicker start={2023} end={2026} />
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={todos}>
          {({ feature }) => (
              <CalendarItem feature={feature}>
                <div className="text-xs text-muted-foreground mt-1">
                  {(feature as CalendarTodoFeature).ideaTitle}
                </div>
              </CalendarItem>
            )}
        </CalendarBody>
      </CalendarProvider>
    </div>
  );
}