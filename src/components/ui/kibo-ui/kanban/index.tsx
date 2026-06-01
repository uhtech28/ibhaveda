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
  useEffect,
  useState,
  memo,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

type UserProfile = {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatar?: string;
};

const t = tunnel();

export type { DragEndEvent } from "@dnd-kit/core";

// Color of the small dot next to the deadline pill on each card.
//   - done       → green
//   - overdue    → destructive (red)
//   - <24h left  → yellow
//   - otherwise  → blue/secondary
type DeadlineColor = "secondary" | "destructive" | "yellow" | "green";
function getDeadlineColor(deadline?: number, status?: string): DeadlineColor {
  if (status === "done") return "green";
  if (!deadline) return "secondary";
  const diff = deadline - Date.now();
  if (diff < 0) return "destructive";
  if (diff < 24 * 60 * 60 * 1000) return "yellow";
  return "secondary";
}

// Task Edit Dialog Component
type TaskEditDialogProps = {
  todo: KanbanItemProps;
  contributors?: UserProfile[];
  onClose: () => void;
  onSave: (updates: { title?: string; assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

export function TaskEditDialog({ todo, contributors = [], onClose, onSave }: TaskEditDialogProps) {
  const [title, setTitle] = useState(todo.name || "");
  const [assignedTo, setAssignedTo] = useState(todo.assignedTo?._id || "unassigned");
  const [deadline, setDeadline] = useState<Date | undefined>(todo.deadline ? new Date(todo.deadline) : undefined);
  const [completionTarget, setCompletionTarget] = useState(todo.completionTarget || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
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
      <div className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-title"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        {/* Assignee */}
        <div className="space-y-1.5">
          <Label htmlFor="assignee" className="text-sm font-medium">
            Assignee
          </Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="w-full">
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

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="deadline" className="text-sm font-medium">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="date"
            value={deadline ? format(deadline, "yyyy-MM-dd") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>

        {/* Target */}
        <div className="space-y-1.5">
          <Label htmlFor="completionTarget" className="text-sm font-medium">
            Target <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="completionTarget"
            placeholder="What needs to be completed..."
            value={completionTarget}
            onChange={(e) => setCompletionTarget(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </DialogContent>
  );
}

export type KanbanItemProps = {
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

type KanbanContextProps<T extends KanbanItemProps = KanbanItemProps, C extends KanbanColumnProps = KanbanColumnProps> = {
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

const KanbanCardInner = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  assignedTo,
  deadline,
  completionTarget,
  status,
  // canDelete,
  canEdit = true,
  onEditClick,
  children,
  className,
  contributors,
}: KanbanCardProps<T> & { canEdit?: boolean; onEditClick?: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    // Even when canEdit is false the card stays mounted; we just disable
    // sortable so drag is a no-op for read-only viewers.
    disabled: !canEdit,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;

  const deadlineColor = getDeadlineColor(deadline, status);

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const cardContent = (
    <Card
      style={{
        transitionProperty: "transform, box-shadow, border-color, background-color, opacity",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDuration: "200ms",
      }}
      className={cn(
        // overflow-hidden — keeps icon buttons inside the card border on
        // narrow PC columns where flex children were bleeding past the
        // right edge. w-full + box-border ensure the card always matches
        // the column width exactly.
        "cursor-default rounded-xl p-2.5 pr-2 shadow-sm hover:shadow-md border-border/50 bg-card group relative w-full box-border overflow-hidden will-change-[transform,box-shadow]",
        isDragging && "pointer-events-none cursor-grabbing opacity-50 scale-105 shadow-xl rotate-2",
        status === "done" && "opacity-70",
        className
      )}
    >
      <div className="space-y-2 w-full min-w-0">
        {/* Header: split into a draggable LEFT side (deadline pill) and a
         * non-draggable RIGHT side (assignee + edit). The edit button used
         * to live INSIDE the drag-listener div, which on mobile caused the
         * TouchSensor to swallow taps before the click could fire.
         */}
        <div className="flex items-center justify-between mb-1.5 gap-1 w-full min-w-0">
          {/* Drag handle: deadline pill */}
          <div
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium cursor-grab active:cursor-grabbing touch-action-none flex-1 min-w-0"
            {...listeners}
            {...attributes}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
              deadlineColor === "destructive" ? "bg-red-500" :
                deadlineColor === "yellow" ? "bg-amber-500" :
                  deadlineColor === "green" ? "bg-emerald-500" :
                    "bg-blue-400"
            )} />
            <span className="truncate">{deadline ? format(new Date(deadline), "MMM dd") : "No deadline"}</span>
          </div>

          {/* Assignee + Edit — outside listeners so taps reliably register.
           * Compact sizes so we never overflow the card edge on narrow
           * desktop columns. */}
          <div className="flex items-center gap-0.5 shrink-0">
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
              <span className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground/40 shrink-0">
                <User className="h-3.5 w-3.5" />
              </span>
            )}

            {/* Edit Button — sits outside drag listeners and delegates to a
             * parent-owned Dialog via onEditClick. */}
            {canEdit && onEditClick && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditClick(id);
                }}
                aria-label="Edit task"
                title="Edit task"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Title / Body */}
        <div className="mb-0 w-full min-w-0">
          {children ? (
            children
          ) : (
            <p className="font-medium text-sm text-foreground leading-relaxed break-words">{name}</p>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <div style={style} ref={setNodeRef} className="group w-full min-w-0">
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
    </>
  );
};

export const KanbanCard = memo(KanbanCardInner, (prevProps: any, nextProps: any) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.status === nextProps.status &&
    prevProps.deadline === nextProps.deadline &&
    prevProps.completionTarget === nextProps.completionTarget &&
    prevProps.canEdit === nextProps.canEdit &&
    prevProps.className === nextProps.className &&
    prevProps.assignedTo?._id === nextProps.assignedTo?._id &&
    prevProps.assignedTo?.avatar === nextProps.assignedTo?.avatar &&
    prevProps.assignedTo?.name === nextProps.assignedTo?.name &&
    prevProps.onEditClick === nextProps.onEditClick
  );
}) as <T extends KanbanItemProps = KanbanItemProps>(
  props: KanbanCardProps<T> & { canEdit?: boolean; onEditClick?: (id: string) => void }
) => React.ReactElement;

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
  children: (item: T) => ReactNode;
  id: string;
  onAdd?: () => void;
};

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  onAdd: _onAdd,
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

export type KanbanProviderProps<T extends KanbanItemProps = KanbanItemProps, C extends KanbanColumnProps = KanbanColumnProps> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <T extends KanbanItemProps = KanbanItemProps, C extends KanbanColumnProps = KanbanColumnProps>({
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

  useEffect(() => {
    checkDeadlinesAndNotify();
  }, [checkDeadlinesAndNotify]);

  // Sensors with activationConstraint: prevents click events on cards from
  // being swallowed as drag-starts. Drag only activates after the pointer
  // moves 8px (mouse) or after a 200ms long-press without moving (touch).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
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
      } catch (error) {
        console.error("Failed to update task status:", error);
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
        {typeof window !== "undefined"
          ? (createPortal(
              <DragOverlay>
                <t.Out />
              </DragOverlay>,
              document.body
            ) as any)
          : null}
      </DndContext>
    </KanbanContext.Provider>
  );
};
