"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import {
  CalendarProvider,
  CalendarDate,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  CalendarHeader,
  CalendarBody,
  CalendarItem,
  Feature,
} from "@/components/ui/kibo-ui/calendar";

type CalendarTodoFeature = Feature & {
  ideaTitle: string;
  ideaId: string;
};

export default function CalendarPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const todos = useQuery(api.todos.getTodosForCalendar);

  React.useEffect(() => {
    if (isLoaded && !userId) router.push("/");
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <FooterSection />
      </div>
    );
  }

  const features = (todos ?? []) as CalendarTodoFeature[];
  const isLoading = todos === undefined;
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-5xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Calendar</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            All upcoming deadlines from todos assigned to you.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : features.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-1">Nothing scheduled</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                When tasks with deadlines are assigned to you, they&apos;ll show
                up on this calendar automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-3 sm:p-6">
              <CalendarProvider>
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <CalendarDate>
                    <div className="flex items-center gap-2">
                      <CalendarMonthPicker />
                      <CalendarYearPicker start={currentYear - 2} end={currentYear + 2} />
                    </div>
                    <CalendarDatePagination />
                  </CalendarDate>
                </div>
                <CalendarHeader />
                <CalendarBody features={features}>
                  {({ feature }) => {
                    const f = feature as CalendarTodoFeature;
                    return (
                      <CalendarItem feature={f}>
                        <Link
                          href={`/idea/${f.ideaId}`}
                          className="block text-[10px] text-muted-foreground mt-0.5 hover:text-primary truncate"
                        >
                          {f.ideaTitle}
                        </Link>
                      </CalendarItem>
                    );
                  }}
                </CalendarBody>
              </CalendarProvider>
            </CardContent>
          </Card>
        )}
      </main>

      <FooterSection />
    </div>
  );
}
