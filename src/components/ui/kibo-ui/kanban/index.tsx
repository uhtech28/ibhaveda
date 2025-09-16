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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, User } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
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
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    if (minutes < 60) return `${minutes}min overdue`;
    if (hours < 24) return `${hours}h overdue`;
    return `${days}d overdue`;
  }

  if (minutes < 60) return `Due in ${minutes}min`;
  if (hours < 24) return `Due in ${hours}h`;
  return `Due in ${days}d`;
}

function getDeadlineIndicator(deadline?: number, status?: string): { color: string; label: string } {
  if (!deadline) return { color: "secondary", label: "" };

  const now = Date.now();
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);

  if (status === "done") return { color: "green", label: "✓ Done" };
  if (diff < 0) return { color: "destructive", label: formatRelativeTime(deadline) };
  if (hours < 24) return { color: "yellow", label: formatRelativeTime(deadline) };
  return { color: "secondary", label: formatRelativeTime(deadline) };
}

// Task Edit Dialog Component
type TaskEditDialogProps = {
  todo: KanbanItemProps;
  onClose: () => void;
  onSave: (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

function TaskEditDialog({ todo, onClose, onSave }: TaskEditDialogProps) {
  const [assignedTo, setAssignedTo] = useState(todo.assignedTo?._id || "");
  const [deadline, setDeadline] = useState<Date | undefined>(todo.deadline ? new Date(todo.deadline) : undefined);
  const [completionTarget, setCompletionTarget] = useState(todo.completionTarget || "");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for assignee dropdown
  const users: UserProfile[] = useQuery(api.users.getAllUsers) || [];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        assignedTo: assignedTo || undefined,
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
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
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
            type="datetime-local"
            value={deadline ? format(deadline, "yyyy-MM-dd'T'HH:mm") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            className="col-span-3"
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
  column?: string;
  status?: "todo" | "in_progress" | "done";
  assignedTo?: { _id: string; name: string; username: string; avatar?: string };
  deadline?: number;
  completionTarget?: string;
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
        "flex size-full flex-col divide-y overflow-hidden rounded-md border bg-secondary text-xs shadow-sm ring-2 transition-all",
        "min-h-8 h-fit",
        isOver ? "ring-primary" : "ring-transparent",
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
  children,
  className,
}: KanbanCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
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
      toast({
        title: "Task updated",
        description: "Task details have been successfully updated.",
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const cardContent = (
    <Card
      className={cn(
        "cursor-grab gap-2 rounded-md p-3 shadow-sm transition-all",
        isDragging && "pointer-events-none cursor-grabbing opacity-30",
        deadlineIndicator.color === "destructive" && "border-red-500",
        deadlineIndicator.color === "yellow" && "border-yellow-500",
        status === "done" && "border-green-500 bg-green-50",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <p className="m-0 font-medium text-sm flex-1">{name}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>

        {completionTarget && (
          <p className="text-xs text-muted-foreground line-clamp-2">{completionTarget}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={assignedTo.avatar} alt={assignedTo.name} />
                  <AvatarFallback className="text-xs">
                    {assignedTo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{assignedTo.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Unassigned</span>
              </div>
            )}
          </div>

          {deadlineIndicator.label && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                deadlineIndicator.color === "destructive" && "border-red-500 text-red-700",
                deadlineIndicator.color === "yellow" && "border-yellow-500 text-yellow-700",
                deadlineIndicator.color === "green" && "border-green-500 text-green-700"
              )}
            >
              {deadlineIndicator.label}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <div style={style} {...listeners} {...attributes} ref={setNodeRef} className="group">
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
            assignedTo,
            deadline,
            completionTarget,
            status,
          }}
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
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <ScrollArea className="overflow-hidden max-h-24">
      <SortableContext items={items}>
        <div
          className={cn(
            "flex flex-col gap-0.5 p-0.5",
            filteredData.length === 0 ? "min-h-8 h-fit" : "",
            className
          )}
          {...props}
        >
          {filteredData.map((item) => <Fragment key={item.id}>{children(item)}</Fragment>)}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn("m-0 p-0.5 font-semibold text-sm", className)} {...props} />
);

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

  // Check for deadline notifications when Kanban loads
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
        // Update the backend first
        await updateTodoStatus({
          todoId: active.id as Id<"todos">,
          status: overColumn as "todo" | "in_progress" | "done",
        });

        // Then update local state
        let newData = [...data];
        const activeIndex = newData.findIndex((item) => item.id === active.id);
        const overIndex = newData.findIndex((item) => item.id === over.id);

        newData[activeIndex].column = overColumn;
        newData[activeIndex].status = overColumn as "todo" | "in_progress" | "done";
        newData = arrayMove(newData, activeIndex, overIndex);

        onDataChange?.(newData);

        toast({
          title: "Task status updated",
          description: `Task moved to ${overColumn.replace('_', ' ')}`,
        });
      } catch (error) {
        console.error("Failed to update task status:", error);
        toast({
          title: "Update failed",
          description: "Failed to update task status. Please try again.",
          variant: "destructive",
        });
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
              "grid size-full gap-1",
              "grid-cols-3",
              className
            )}
        >
          {columns.map((column) => <Fragment key={column.id}>{children(column)}</Fragment>)}
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
