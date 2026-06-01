"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Check,
  Plus,
  Trash2,
  LayoutDashboard,
  GripVertical,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface KanbanCard {
  id: string;
  title: string;
  column: "todo" | "inprogress" | "done";
  updatedAt?: number;
  assignedTo?: {
    _id: string;
    name?: string;
    avatar?: string;
    username?: string;
    displayName?: string;
  };
  deadline?: number;
  completionTarget?: string;
}

interface KanbanToolProps {
  prompt: string;
  onSubmit: (content: {
    cards: KanbanCard[];
    columns: string[];
    timestamp: number;
  }) => void;
  initialContent?: {
    cards: KanbanCard[];
    columns: string[];
    timestamp: number;
  };
  isSubmitting?: boolean;
  isStandalone?: boolean;
  activeVentureId?: Id<"ventures">;
}

// Draggable Card Component
const DraggableCard = React.memo(({
  card,
  onDelete,
  onMove,
}: {
  card: KanbanCard;
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transitionProperty: transition ? "transform, box-shadow, opacity" : "box-shadow, opacity",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDuration: "200ms",
      }}
      className="p-3 border rounded-md bg-background shadow-sm hover:shadow-md will-change-[transform,box-shadow]"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex items-start gap-2 flex-1 min-w-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-snug text-white break-words">{card.title}</div>
            
            {card.completionTarget && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed break-words">
                {card.completionTarget}
              </p>
            )}

            {(card.assignedTo || card.deadline) && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {card.assignedTo && (
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full pl-1 pr-2 py-0.5 text-[9px] font-bold text-zinc-300">
                    <Avatar className="h-4 w-4 shrink-0">
                      {card.assignedTo.avatar ? (
                        <AvatarImage src={card.assignedTo.avatar} alt={card.assignedTo.displayName || card.assignedTo.username} />
                      ) : null}
                      <AvatarFallback className="text-[7px] bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        {(card.assignedTo.displayName || card.assignedTo.username || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[70px] truncate">
                      {card.assignedTo.displayName || card.assignedTo.username}
                    </span>
                  </div>
                )}
                {card.deadline && (
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[9px] font-medium">
                    📅 {new Date(card.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {card.column !== "todo" && onMove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-white"
              onClick={() => onMove(card.id, card.column === "done" ? "inprogress" : "todo")}
              title="Move left"
            >
              <span className="text-xs">←</span>
            </Button>
          )}
          {card.column !== "done" && onMove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-white"
              onClick={() => onMove(card.id, card.column === "todo" ? "inprogress" : "done")}
              title="Move right"
            >
              <span className="text-xs">→</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(card.id)}
            title="Delete card"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.card.column === nextProps.card.column &&
    prevProps.card.updatedAt === nextProps.card.updatedAt &&
    prevProps.card.completionTarget === nextProps.card.completionTarget &&
    prevProps.card.deadline === nextProps.card.deadline &&
    prevProps.card.assignedTo?._id === nextProps.card.assignedTo?._id &&
    prevProps.card.assignedTo?.avatar === nextProps.card.assignedTo?.avatar &&
    prevProps.card.assignedTo?.displayName === nextProps.card.assignedTo?.displayName &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onMove === nextProps.onMove
  );
});

DraggableCard.displayName = "DraggableCard";

// Droppable Column Component
const DroppableColumn = React.memo(({
  column,
  cards,
  onDelete,
  onMove,
}: {
  column: { id: "todo" | "inprogress" | "done"; label: string; color: string };
  cards: KanbanCard[];
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
}) => {
  return (
    <div className="space-y-2">
      <div className={`p-2 rounded-md ${column.color}`}>
        <h3 className="text-sm font-semibold text-center">{column.label}</h3>
        <p className="text-xs text-center text-muted-foreground">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </p>
      </div>
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px] p-2 border-2 border-dashed border-white/40 rounded-lg bg-white/[0.02]">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-xs text-white/55">
              Drop cards here
            </div>
          ) : (
            cards.map((card) => (
              <DraggableCard key={card.id} card={card} onDelete={onDelete} onMove={onMove} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}, (prevProps, nextProps) => {
  if (
    prevProps.column.id !== nextProps.column.id ||
    prevProps.column.label !== nextProps.column.label ||
    prevProps.column.color !== nextProps.column.color ||
    prevProps.onDelete !== nextProps.onDelete ||
    prevProps.onMove !== nextProps.onMove
  ) {
    return false;
  }
  if (prevProps.cards.length !== nextProps.cards.length) return false;
  for (let i = 0; i < prevProps.cards.length; i++) {
    const pc = prevProps.cards[i];
    const nc = prevProps.cards[i];
    if (
      pc.id !== nc.id ||
      pc.title !== nc.title ||
      pc.column !== nc.column ||
      pc.updatedAt !== nc.updatedAt ||
      pc.completionTarget !== nc.completionTarget ||
      pc.deadline !== nc.deadline ||
      pc.assignedTo?._id !== nc.assignedTo?._id
    ) {
      return false;
    }
  }
  return true;
});

DroppableColumn.displayName = "DroppableColumn";

export function KanbanTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
  isStandalone,
  activeVentureId,
}: KanbanToolProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialContent?.cards || []);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [activeColumn, setActiveColumn] = useState<
    "todo" | "inprogress" | "done"
  >("todo");
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColTab, setActiveColTab] = useState<"todo" | "inprogress" | "done">("todo");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New state variables for form inputs
  const [newCardAssignee, setNewCardAssignee] = useState("unassigned");
  const [newCardDeadline, setNewCardDeadline] = useState("");
  const [newCardCompletionTarget, setNewCardCompletionTarget] = useState("");

  // Queries to fetch venture & contributors list
  const venture = useQuery(
    api.ventures.getVenture,
    activeVentureId ? { ventureId: activeVentureId } : "skip"
  );
  const ideaId = venture?.ideaId;

  const allUsers = useQuery(api.users.getAllUsers) || [];
  const acceptedRequests = useQuery(
    api.contributionRequests.getAcceptedContributors,
    ideaId ? { ideaId } : "skip"
  ) || [];

  const contributors = venture && ideaId
    ? allUsers.filter((u) => u._id === venture.userId || acceptedRequests.some((req) => req.userId === u._id)).map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
      }))
    : [];

  const handleMoveCard = (cardId: string, newColumn: "todo" | "inprogress" | "done") => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, column: newColumn, updatedAt: Date.now() } : card
      )
    );
  };

  useEffect(() => {
    if (initialContent?.cards) {
      setCards(initialContent.cards);
    }
  }, [initialContent]);

  const columns: {
    id: "todo" | "inprogress" | "done";
    label: string;
    color: string;
  }[] = [
    { id: "todo", label: "To Do", color: "bg-slate-100 dark:bg-slate-900" },
    {
      id: "inprogress",
      label: "In Progress",
      color: "bg-blue-100 dark:bg-blue-950",
    },
    { id: "done", label: "Done", color: "bg-green-100 dark:bg-green-950" },
  ];

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  );

  const addCard = () => {
    if (!newCardTitle.trim()) return;

    const assigneeUser = contributors.find((u) => u._id === newCardAssignee);
    const assignedTo = assigneeUser
      ? {
          _id: assigneeUser._id,
          name: assigneeUser.displayName || assigneeUser.username,
          displayName: assigneeUser.displayName,
          username: assigneeUser.username,
          avatar: assigneeUser.avatar,
        }
      : undefined;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newCardTitle.trim(),
      column: activeColumn,
      updatedAt: Date.now(),
      assignedTo,
      deadline: newCardDeadline ? new Date(newCardDeadline).getTime() : undefined,
      completionTarget: newCardCompletionTarget.trim() || undefined,
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    onSubmit({
      cards: updatedCards,
      columns: columns.map((c) => c.label),
      timestamp: Date.now(),
    });
    setNewCardTitle("");
    setNewCardAssignee("unassigned");
    setNewCardDeadline("");
    setNewCardCompletionTarget("");
    setIsModalOpen(false);
  };

  const openModal = () => {
    setNewCardTitle("");
    setNewCardAssignee("unassigned");
    setNewCardDeadline("");
    setNewCardCompletionTarget("");
    setIsModalOpen(true);
  };

  const deleteCard = (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    setCards(updatedCards);
    onSubmit({
      cards: updatedCards,
      columns: columns.map((c) => c.label),
      timestamp: Date.now(),
    });
  };

  const getCardsForColumn = (columnId: "todo" | "inprogress" | "done") => {
    return cards.filter((card) => card.column === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    // Check if we're over a different column by checking the card's column
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard && overCard.column !== activeCard.column) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id
            ? { ...card, column: overCard.column, updatedAt: Date.now() }
            : card,
        ),
      );
    }

    // Check if we're over a column (by checking if over.id matches column id)
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn && overColumn.id !== activeCard.column) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id ? { ...card, column: overColumn.id, updatedAt: Date.now() } : card,
        ),
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    let targetColumn: "todo" | "inprogress" | "done" | null = null;

    // If dropped on a card, move to that card's column
    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      targetColumn = overCard.column;
    }

    // If dropped on a column container
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      targetColumn = overColumn.id;
    }

    if (targetColumn && targetColumn !== activeCard.column) {
      const updatedCards = cards.map((card) =>
        card.id === activeCard.id
          ? { ...card, column: targetColumn!, updatedAt: Date.now() }
          : card
      );
      setCards(updatedCards);
      onSubmit({
        cards: updatedCards,
        columns: columns.map((c) => c.label),
        timestamp: Date.now(),
      });
    }
  };

  const handleSubmit = () => {
    onSubmit({
      cards,
      columns: columns.map((c) => c.label),
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-4 py-1">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/5">
        {prompt ? (
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            {prompt}
          </p>
        ) : (
          <div />
        )}
        <Button
          onClick={openModal}
          size="sm"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 shrink-0 text-xs"
          title="Add New Card"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Kanban Board with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Column selector for small screens / drawers */}
        <div className="flex md:hidden gap-1 mb-3 bg-black/20 p-1 rounded-xl border border-white/5">
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveColTab(col.id)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest text-center",
                activeColTab === col.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {col.label}
            </button>
          ))}
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2">
            {columns.map((column) => {
              const isVisible = activeColTab === column.id;
              return (
                <div key={column.id} className={cn("md:block", isVisible ? "block" : "hidden")}>
                  <DroppableColumn
                    column={column}
                    cards={getCardsForColumn(column.id)}
                    onDelete={deleteCard}
                    onMove={handleMoveCard}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay - Shows the card being dragged */}
        <DragOverlay>
          {activeCard ? (
            <div className="p-3 border rounded-md bg-background shadow-lg opacity-90 cursor-grabbing">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm flex-1">{activeCard.title}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="pt-3 border-t border-white/5">
        <p className="text-xs text-muted-foreground mb-3">
          Total cards: {cards.length} | Drag and drop cards between columns
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isStandalone ? "Saving..." : "Submitting..."}</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{isStandalone ? "Save Board" : "Submit Board"}</span>
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-[#0D111A]/95 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Add Kanban Card
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Create a new task for your venture board.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 py-2">
                {/* Task Title */}
                <div className="space-y-1">
                  <Label htmlFor="task-title" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="Task title..."
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm"
                  />
                </div>

                {/* Assign To */}
                <div className="space-y-1">
                  <Label htmlFor="task-assignee" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Assign To
                  </Label>
                  <Select value={newCardAssignee} onValueChange={setNewCardAssignee}>
                    <SelectTrigger id="task-assignee" className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0D111A] border-white/10 text-white z-[10100]">
                      <SelectItem value="unassigned">
                        <span className="text-slate-300">Unassigned</span>
                      </SelectItem>
                      {contributors.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-[9px] bg-primary/15 text-primary font-bold">
                                {(user.displayName || user.username || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-200">{user.displayName || user.username}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <Label htmlFor="task-deadline" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Deadline
                  </Label>
                  <Input
                    id="task-deadline"
                    type="date"
                    value={newCardDeadline}
                    onChange={(e) => setNewCardDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm [color-scheme:dark]"
                  />
                </div>

                {/* Target (optional) */}
                <div className="space-y-1">
                  <Label htmlFor="task-target" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Target <span className="text-[10px] text-zinc-500 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="task-target"
                    placeholder="What needs to be completed..."
                    value={newCardCompletionTarget}
                    onChange={(e) => setNewCardCompletionTarget(e.target.value)}
                    rows={3}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-sm resize-none"
                  />
                </div>

                {/* Initial Status */}
                <div className="space-y-1">
                  <Label htmlFor="task-column" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Initial Status
                  </Label>
                  <select
                    id="task-column"
                    value={activeColumn}
                    onChange={(e) =>
                      setActiveColumn(
                        e.target.value as "todo" | "inprogress" | "done",
                      )
                    }
                    className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-[#121824] text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addCard}
                  disabled={!newCardTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all duration-300"
                >
                  Add Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
