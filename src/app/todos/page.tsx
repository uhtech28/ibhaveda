"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTodo, Calendar, Lightbulb, Loader2, ArrowRight, Circle, Clock, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Status display config — matches the existing per-idea Kanban
const STATUS_COLUMNS = [
  { key: "todo" as const, label: "To Do", icon: Circle, accent: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/5" },
  { key: "in_progress" as const, label: "In Progress", icon: Clock, accent: "text-yellow-500", border: "border-yellow-500/30", bg: "bg-yellow-500/5" },
  { key: "done" as const, label: "Done", icon: CheckCircle2, accent: "text-green-500", border: "border-green-500/30", bg: "bg-green-500/5" },
];

export default function TodosPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  // Reuses the same Convex query the per-idea TodoSection uses for assignments,
  // but globally across every idea the user is contributing to.
  const todos = useQuery(api.todos.getMyAssignedTodos);
  const updateTodoStatus = useMutation(api.todos.updateTodoStatus);

  React.useEffect(() => {
    if (isLoaded && !userId) router.push("/");
  }, [isLoaded, userId, router]);

  const isLoading = !isLoaded || todos === undefined;

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

  const list = todos ?? [];

  // Group by status
  const grouped = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: list.filter((t) => t.status === col.key),
  }));

  const total = list.length;
  const overdueCount = list.filter((t) => t.deadline && t.deadline < Date.now() && t.status !== "done").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ListTodo className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">My Todos</h1>
              <Badge variant="secondary" className="rounded-full">{total}</Badge>
              {overdueCount > 0 && (
                <Badge className="rounded-full bg-red-500/15 text-red-500 border-red-500/30">
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              All tasks assigned to you across every idea. To create a new task, open the relevant idea.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ListTodo className="h-10 w-10 text-muted-foreground mb-3" />
              <h2 className="text-lg font-semibold mb-1">No assigned todos</h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                When someone assigns you a task on an idea (or you assign yourself), it&apos;ll appear here.
              </p>
              <Link href="/feed">
                <Button variant="outline" size="sm">
                  Browse ideas <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {grouped.map((col) => (
              <Column
                key={col.key}
                column={col}
                onChangeStatus={(todoId, newStatus) =>
                  updateTodoStatus({ todoId: todoId as Id<"todos">, status: newStatus })
                }
              />
            ))}
          </div>
        )}
      </main>

      <FooterSection />
    </div>
  );
}

type AssignedTodo = {
  _id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  deadline?: number;
  idea: { _id: string; title: string };
};

function Column({
  column,
  onChangeStatus,
}: {
  column: typeof STATUS_COLUMNS[number] & { items: AssignedTodo[] };
  onChangeStatus: (todoId: string, newStatus: "todo" | "in_progress" | "done") => void;
}) {
  const Icon = column.icon;
  return (
    <div className={`rounded-2xl border-2 ${column.border} ${column.bg} flex flex-col`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${column.border}`}>
        <Icon className={`h-4 w-4 ${column.accent}`} />
        <h2 className={`text-sm font-semibold ${column.accent}`}>{column.label}</h2>
        <Badge variant="secondary" className="ml-auto rounded-full text-xs">
          {column.items.length}
        </Badge>
      </div>
      <div className="p-3 space-y-2 min-h-[120px]">
        {column.items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nothing here.</p>
        ) : (
          column.items.map((t) => (
            <TodoCard key={t._id} todo={t} columnKey={column.key} onChangeStatus={onChangeStatus} />
          ))
        )}
      </div>
    </div>
  );
}

function TodoCard({
  todo,
  columnKey,
  onChangeStatus,
}: {
  todo: AssignedTodo;
  columnKey: "todo" | "in_progress" | "done";
  onChangeStatus: (todoId: string, newStatus: "todo" | "in_progress" | "done") => void;
}) {
  const overdue = todo.deadline && todo.deadline < Date.now() && todo.status !== "done";

  return (
    <div className="rounded-lg bg-background border border-border/60 p-3 hover:border-primary/40 hover:shadow-sm transition-all">
      <Link href={`/idea/${todo.idea._id}`}>
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">
          {todo.title}
        </h3>
      </Link>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
        <Lightbulb className="h-3 w-3 shrink-0" />
        <Link href={`/idea/${todo.idea._id}`} className="truncate hover:text-primary">
          {todo.idea.title}
        </Link>
      </div>

      {todo.deadline && (
        <div className={`flex items-center gap-1.5 text-[11px] mb-2 ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
          <Calendar className="h-3 w-3 shrink-0" />
          <span>
            {format(todo.deadline, "MMM d")}
            {overdue ? " · overdue" : ` · ${formatDistanceToNow(todo.deadline, { addSuffix: true })}`}
          </span>
        </div>
      )}

      {/* Status quick-change buttons */}
      <div className="flex gap-1 mt-2">
        {(["todo", "in_progress", "done"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeStatus(todo._id, s)}
            disabled={s === columnKey}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              s === columnKey
                ? "bg-primary text-primary-foreground border-primary cursor-default"
                : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            title={`Move to ${s.replace("_", " ")}`}
          >
            {s === "todo" ? "Todo" : s === "in_progress" ? "Doing" : "Done"}
          </button>
        ))}
      </div>
    </div>
  );
}
