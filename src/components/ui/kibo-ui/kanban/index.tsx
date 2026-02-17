"use client";

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Fragment,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

type UserProfile = {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatar?: string;
};

const t = tunnel();

export type { DragEndEvent } from "@dnd-kit/core";

// Utility functions for task enhancements
function formatDeadlineDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  if (isYesterday) return "Yesterday";

  return format(date, "MMM dd");
}

function getDeadlineIndicator(deadline?: number, status?: string): { color: string; label: string } {
  if (!deadline) return { color: "secondary", label: "" };

  const now = Date.now();
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);

  if (status === "done") return { color: "green", label: "✓ Done" };
  if (diff < 0) return { color: "destructive", label: formatDeadlineDate(deadline) };
  if (hours < 24) return { color: "yellow", label: formatDeadlineDate(deadline) };
  return { color: "secondary", label: formatDeadlineDate(deadline) };
}

// Task Edit Dialog Component
type TaskEditDialogProps = {
  todo: KanbanItemProps;
  contributors?: UserProfile[];
  onClose: () => void;
  onSave: (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

function TaskEditDialog({ todo, contributors = [], onClose, onSave }: TaskEditDialogProps) {
  const [assignedTo, setAssignedTo] = useState(todo.assignedTo?._id || "unassigned");
  const [deadline, setDeadline] = useState<Date | undefined>(todo.deadline ? new Date(todo.deadline) : undefined);
  const [completionTarget, setCompletionTarget] = useState(todo.completionTarget || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
        deadline: deadline?.getTime(),
        completionTarget: completionTarget || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save task updates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="assignee" className="text-right">
            Assignee
          </Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {contributors.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="deadline" className="text-right">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="date"
            value={deadline ? format(deadline, "yyyy-MM-dd") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            className="col-span-3"
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="completionTarget" className="text-right">
            Target
          </Label>
          <Textarea
            id="completionTarget"
            placeholder="What needs to be completed..."
            value={completionTarget}
            onChange={(e) => setCompletionTarget(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </DialogContent>
  );
}

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
  status?: "todo" | "in_progress" | "done";
  assignedTo?: { _id: string; name: string; username: string; avatar?: string };
  deadline?: number;
  completionTarget?: string;
  canDelete?: boolean;
  contributors?: UserProfile[];
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl border bg-secondary/10 text-xs shadow-sm ring-1 ring-border/50 transition-all",
        "min-h-[150px] h-fit",
        isOver ? "ring-2 ring-primary bg-primary/5" : "",
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  assignedTo,
  deadline,
  completionTarget,
  status,
  // canDelete,
  canEdit = true,
  children,
  className,
  contributors,
}: KanbanCardProps<T> & { canEdit?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled: !canEdit,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;
  const { toast } = useToast();

  const deadlineIndicator = getDeadlineIndicator(deadline, status);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const updateTodo = useMutation(api.todos.updateTodo);

  const handleEditSave = async (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => {
    try {
      await updateTodo({
        todoId: id as Id<"todos">,
        assignedTo: updates.assignedTo as Id<"users"> | undefined,
        deadline: updates.deadline,
        completionTarget: updates.completionTarget,
      });
      // toast removed
    } catch (error) {
      console.error("Failed to update task:", error);
      // toast removed
    }
  };

  // const handleDelete = async () => {
  //   if (!confirm("Are you sure you want to delete this todo?")) return;
  //   try {
  //     await deleteTodo({ todoId: id as Id<"todos"> });
  //     toast({
  //       title: "Task deleted",
  //       description: "Task has been successfully deleted.",
  //     });
  //   } catch (error) {
  //     console.error("Failed to delete task:", error);
  //     toast({
  //       title: "Delete failed",
  //       description: "Failed to delete task. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const cardContent = (
    <Card
      className={cn(
        "cursor-default rounded-xl p-3 shadow-sm transition-all hover:shadow-md border-border/50 bg-card group relative",
        isDragging && "pointer-events-none cursor-grabbing opacity-50 scale-105 shadow-xl rotate-2",
        status === "done" && "opacity-70",
        className
      )}
    >


      <div className="space-y-2">
        {/* Header: Drag Handle & Metadata (Deadline + Assignee) */}
        <div
          className="flex items-start justify-between mb-1.5 cursor-grab active:cursor-grabbing touch-action-none"
          {...listeners}
          {...attributes}
        >
          {/* Deadline Badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <div className={cn("w-2 h-2 rounded-full",
              deadlineIndicator.color === "destructive" ? "bg-red-500" :
                deadlineIndicator.color === "yellow" ? "bg-amber-500" :
                  deadlineIndicator.color === "green" ? "bg-emerald-500" :
                    "bg-blue-400"
            )} />
            {deadline ? format(new Date(deadline), "MMM dd") : "No deadline"}
          </div>

          <div className="flex items-center gap-1">
            {/* Assignee */}
            <div className="flex items-center gap-2 ml-2">
              {assignedTo ? (
                <Avatar className="h-5 w-5 shrink-0 ring-1 ring-background">
                  <AvatarImage src={assignedTo.avatar} alt={assignedTo.name} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {assignedTo.name
                      ? assignedTo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : assignedTo.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex items-center text-muted-foreground/40">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Edit Button */}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-muted-foreground/50 hover:text-foreground"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Title / Body */}
        <div className="mb-0">
          {children ? (
            children
          ) : (
            <p className="font-medium text-sm text-foreground leading-relaxed">{name}</p>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <div style={style} {...attributes} ref={setNodeRef} className="group">
        {cardContent}
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "cursor-grab gap-2 rounded-md p-1 shadow-sm ring-2 ring-primary",
              isDragging && "cursor-grabbing",
              className
            )}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        </t.In>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <TaskEditDialog
          todo={{
            id,
            name,
            column: "todo",
            assignedTo,
            deadline,
            completionTarget,
            status,
            contributors,
          }}
          contributors={contributors}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleEditSave}
        />
      </Dialog>
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
    onAdd?: () => void;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  onAdd,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <ScrollArea className="flex-1 w-full h-full min-h-[100px]">
      <SortableContext items={items}>
        <div
          className={cn(
            "flex flex-col gap-2 p-2",
            filteredData.length === 0 ? "min-h-[100px] h-full" : "",
            className
          )}
          {...props}
        >
          {filteredData.map((item) => (
            <Fragment key={item.id}>{children(item)}</Fragment>
          ))}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement> & {
  color?: "blue" | "orange" | "green" | "default";
  count?: number;
};

export const KanbanHeader = ({ className, color = "default", count, children, ...props }: KanbanHeaderProps) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    green: "bg-green-50 text-green-700 border-green-100",
    default: "bg-muted/30 text-muted-foreground/80 border-border/50",
  };

  return (
    <div className={cn("flex items-center justify-between m-0 p-2 font-semibold text-sm rounded-t-xl border-b", colorStyles[color], className)} {...props}>
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {count !== undefined && (
          <span className="text-xs opacity-70 bg-white/40 px-2 py-0.5 rounded-full font-normal">{count}</span>
        )}
      </div>
    </div>
  );
};

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const updateTodoStatus = useMutation(api.todos.updateTodoStatus);
  const checkDeadlinesAndNotify = useMutation(api.todos.checkDeadlinesAndNotify);
  const { toast } = useToast();

  useEffect(() => {
    checkDeadlinesAndNotify();
  }, [checkDeadlinesAndNotify]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id as string);
    }
    onDragStart?.(event);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    if (activeColumn !== overColumn) {
      try {
        await updateTodoStatus({
          todoId: active.id as Id<"todos">,
          status: overColumn as "todo" | "in_progress" | "done",
        });

        let newData = [...data];
        const activeIndex = newData.findIndex((item) => item.id === active.id);
        const overIndex = newData.findIndex((item) => item.id === over.id);

        newData[activeIndex].column = overColumn;
        newData[activeIndex].status = overColumn as "todo" | "in_progress" | "done";
        newData = arrayMove(newData, activeIndex, overIndex);

        onDataChange?.(newData);

        onDataChange?.(newData);

        // toast removed
      } catch (error) {
        console.error("Failed to update task status:", error);
        // toast removed
      }
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    onDragEnd?.(event);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    let newData = [...data];
    const oldIndex = newData.findIndex((item) => item.id === active.id);
    const newIndex = newData.findIndex((item) => item.id === over.id);

    newData = arrayMove(newData, oldIndex, newIndex);
    onDataChange?.(newData);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};
      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;
      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;
      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...props}
      >
        <div
          className={cn(
            "grid size-full gap-2",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            className
          )}
        >
          {columns.map((column) => (
            <Fragment key={column.id}>{children(column)}</Fragment>
          ))}
        </div>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
