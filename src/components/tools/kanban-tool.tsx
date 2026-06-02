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
  Pencil,
  Calendar,
  User,
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
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface KanbanCard {
  id: string;
  title: string;
  column: "todo" | "inprogress" | "done";
  updatedAt?: number;
  assignedTo?: string; // User ID
  deadline?: number; // timestamp
  completionTarget?: string; // target description text
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
}

// Draggable Card Component
function DraggableCard({
  card,
  onDelete,
  onMove,
  onEdit,
  contributors = [],
}: {
  card: KanbanCard;
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
  onEdit?: (card: KanbanCard) => void;
  contributors?: any[];
}) {
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

  // Find assigned user profile
  const assignee = contributors.find((u) => u._id === card.assignedTo);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border border-white/10 rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col gap-2">
        {/* Top Row: Drag Handle + Deadline + Assignee + Edit */}
        <div className="flex items-center justify-between gap-1 w-full">
          <div
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium cursor-grab active:cursor-grabbing flex-1 min-w-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            {card.deadline ? (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-300 truncate">
                <Calendar className="w-2.5 h-2.5 text-indigo-455 shrink-0" />
                <span>{format(new Date(card.deadline), "MMM dd")}</span>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-500">No deadline</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Assignee Avatar */}
            {assignee ? (
              <Avatar className="h-5 w-5 shrink-0 ring-1 ring-white/10" title={assignee.displayName || assignee.username}>
                <AvatarImage src={assignee.avatar} alt={assignee.displayName} />
                <AvatarFallback className="text-[8px] bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                  {assignee.displayName
                    ? assignee.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                    : assignee.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center text-zinc-600 shrink-0" title="Unassigned">
                <User className="h-3 w-3" />
              </span>
            )}

            {/* Edit Button */}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white"
                onClick={() => onEdit(card)}
                title="Edit task"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-semibold text-white leading-snug break-words">
          {card.title}
        </div>

        {/* Target Description */}
        {card.completionTarget && (
          <p className="text-[11px] text-zinc-400 leading-normal border-t border-white/5 pt-1.5 italic line-clamp-2">
            {card.completionTarget}
          </p>
        )}

        {/* Bottom Row: Move Actions & Delete */}
        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
          <div className="flex items-center gap-0.5">
            {card.column !== "todo" && onMove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md"
                onClick={() => onMove(card.id, card.column === "done" ? "inprogress" : "todo")}
                title="Move left"
              >
                <span className="text-[10px]">←</span>
              </Button>
            )}
            {card.column !== "done" && onMove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md"
                onClick={() => onMove(card.id, card.column === "todo" ? "inprogress" : "done")}
                title="Move right"
              >
                <span className="text-[10px]">→</span>
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
            onClick={() => onDelete(card.id)}
            title="Delete card"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  cards,
  onDelete,
  onMove,
  onEdit,
  contributors = [],
}: {
  column: { id: "todo" | "inprogress" | "done"; label: string; color: string };
  cards: KanbanCard[];
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
  onEdit?: (card: KanbanCard) => void;
  contributors?: any[];
}) {
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
              <DraggableCard
                key={card.id}
                card={card}
                onDelete={onDelete}
                onMove={onMove}
                onEdit={onEdit}
                contributors={contributors}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
  isStandalone,
}: KanbanToolProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialContent?.cards || []);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardAssignee, setNewCardAssignee] = useState("unassigned");
  const [newCardDeadline, setNewCardDeadline] = useState("");
  const [newCardTarget, setNewCardTarget] = useState("");

  const [activeColumn, setActiveColumn] = useState<
    "todo" | "inprogress" | "done"
  >("todo");
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColTab, setActiveColTab] = useState<"todo" | "inprogress" | "done">("todo");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit states
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardAssignee, setEditCardAssignee] = useState("unassigned");
  const [editCardDeadline, setEditCardDeadline] = useState("");
  const [editCardTarget, setEditCardTarget] = useState("");

  // URL Parameters for dynamic Venture/Contributor matching
  const params = useParams();
  const searchParams = useSearchParams();
  const urlVentureId = (params?.id as string) || (searchParams?.get("ventureId") as string);

  // Get Venture + Idea ID
  const venture = useQuery(
    api.ventures.getVenture,
    urlVentureId ? { ventureId: urlVentureId as Id<"ventures"> } : "skip"
  );
  const ideaId = venture?.ideaId;

  // Get Contributors List
  const allUsers = useQuery(api.users.getAllUsers) || [];
  const acceptedRequests = useQuery(
    api.contributionRequests.getAcceptedContributors,
    ideaId ? { ideaId: ideaId as Id<"ideas"> } : "skip"
  ) || [];

  const contributors = allUsers
    .filter(
      (u) =>
        u._id === venture?.userId ||
        acceptedRequests.some((req) => req.userId === u._id)
    )
    .map((u) => ({
      _id: u._id,
      clerkId: u.clerkId,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
    }));

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

  useEffect(() => {
    if (editingCard) {
      setEditCardTitle(editingCard.title);
      setEditCardAssignee(editingCard.assignedTo || "unassigned");
      setEditCardDeadline(
        editingCard.deadline
          ? format(new Date(editingCard.deadline), "yyyy-MM-dd")
          : ""
      );
      setEditCardTarget(editingCard.completionTarget || "");
    }
  }, [editingCard]);

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
        distance: 8,
      },
    }),
  );

  const addCard = () => {
    if (!newCardTitle.trim()) return;
    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newCardTitle.trim(),
      column: activeColumn,
      updatedAt: Date.now(),
      assignedTo: newCardAssignee === "unassigned" ? undefined : newCardAssignee,
      deadline: newCardDeadline ? new Date(newCardDeadline).getTime() : undefined,
      completionTarget: newCardTarget.trim() || undefined,
    };
    setCards([...cards, newCard]);
    setNewCardTitle("");
    setNewCardAssignee("unassigned");
    setNewCardDeadline("");
    setNewCardTarget("");
    setIsModalOpen(false);
  };

  const deleteCard = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId));
  };

  const saveEditedCard = () => {
    if (!editingCard || !editCardTitle.trim()) return;
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === editingCard.id
          ? {
              ...card,
              title: editCardTitle.trim(),
              assignedTo: editCardAssignee === "unassigned" ? undefined : editCardAssignee,
              deadline: editCardDeadline ? new Date(editCardDeadline).getTime() : undefined,
              completionTarget: editCardTarget.trim() || undefined,
              updatedAt: Date.now(),
            }
          : card
      )
    );
    setEditingCard(null);
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

    const overCard = cards.find((c) => c.id === over.id);
    if (overCard) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id
            ? { ...card, column: overCard.column, updatedAt: Date.now() }
            : card,
        ),
      );
    }

    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id ? { ...card, column: overColumn.id, updatedAt: Date.now() } : card,
        ),
      );
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
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 shrink-0 text-xs"
          title="Add New Todo"
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
                    onEdit={setEditingCard}
                    contributors={contributors}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay - Shows the card being dragged */}
        <DragOverlay>
          {activeCard ? (
            <div className="p-3 border border-white/10 rounded-xl bg-card shadow-lg opacity-90 cursor-grabbing">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                    <GripVertical className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    {activeCard.deadline ? (
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[10px] text-zinc-300">
                        <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{format(new Date(activeCard.deadline), "MMM dd")}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500">No deadline</span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white leading-snug">
                  {activeCard.title}
                </div>
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
          disabled={cards.length === 0 || isSubmitting}
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

      {/* Add Task Modal */}
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
                    Add New Todo
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Create a new task on the Kanban board.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-2">
                {/* Title */}
                <div className="space-y-1">
                  <Label htmlFor="task-title" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="Task title..."
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCard()}
                    autoFocus
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Assign To */}
                <div className="space-y-1">
                  <Label htmlFor="task-assignee" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Assign To
                  </Label>
                  <select
                    id="task-assignee"
                    value={newCardAssignee}
                    onChange={(e) => setNewCardAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-[#121824] text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  >
                    <option value="unassigned">Unassigned</option>
                    {contributors.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.displayName || user.username}
                      </option>
                    ))}
                  </select>
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
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Target */}
                <div className="space-y-1">
                  <Label htmlFor="task-target" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Target <span className="text-xs text-zinc-500 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="task-target"
                    placeholder="What needs to be completed..."
                    value={newCardTarget}
                    onChange={(e) => setNewCardTarget(e.target.value)}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 min-h-[80px]"
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
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                >
                  Create Task
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCard(null)}
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
                    <Pencil className="w-4 h-4 text-indigo-400" />
                    Edit Kanban Card
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Update task details on the Kanban board.</p>
                </div>
                <button
                  onClick={() => setEditingCard(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-2">
                {/* Title */}
                <div className="space-y-1">
                  <Label htmlFor="edit-task-title" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-task-title"
                    placeholder="Task title..."
                    value={editCardTitle}
                    onChange={(e) => setEditCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEditedCard()}
                    autoFocus
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Assign To */}
                <div className="space-y-1">
                  <Label htmlFor="edit-task-assignee" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Assign To
                  </Label>
                  <select
                    id="edit-task-assignee"
                    value={editCardAssignee}
                    onChange={(e) => setEditCardAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm bg-[#121824] text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="unassigned">Unassigned</option>
                    {contributors.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.displayName || user.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <Label htmlFor="edit-task-deadline" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Deadline
                  </Label>
                  <Input
                    id="edit-task-deadline"
                    type="date"
                    value={editCardDeadline}
                    onChange={(e) => setEditCardDeadline(e.target.value)}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Target */}
                <div className="space-y-1">
                  <Label htmlFor="edit-task-target" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Target <span className="text-xs text-zinc-500 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="edit-task-target"
                    placeholder="What needs to be completed..."
                    value={editCardTarget}
                    onChange={(e) => setEditCardTarget(e.target.value)}
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={() => setEditingCard(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedCard}
                  disabled={!editCardTitle.trim()}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
