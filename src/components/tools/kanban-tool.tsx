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

interface KanbanCard {
  id: string;
  title: string;
  column: "todo" | "inprogress" | "done";
  updatedAt?: number;
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
}: {
  card: KanbanCard;
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 border rounded-md bg-background shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex items-start gap-2 flex-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab shrink-0" />
          <div className="text-sm flex-1 leading-snug">{card.title}</div>
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
}

// Droppable Column Component
function DroppableColumn({
  column,
  cards,
  onDelete,
  onMove,
}: {
  column: { id: "todo" | "inprogress" | "done"; label: string; color: string };
  cards: KanbanCard[];
  onDelete: (id: string) => void;
  onMove?: (id: string, newColumn: "todo" | "inprogress" | "done") => void;
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
              <DraggableCard key={card.id} card={card} onDelete={onDelete} onMove={onMove} />
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
  const [activeColumn, setActiveColumn] = useState<
    "todo" | "inprogress" | "done"
  >("todo");
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColTab, setActiveColTab] = useState<"todo" | "inprogress" | "done">("todo");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newCardTitle.trim(),
      column: activeColumn,
      updatedAt: Date.now(),
    };
    setCards([...cards, newCard]);
    setNewCardTitle("");
    setIsModalOpen(false);
  };

  const deleteCard = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId));
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

    // If dropped on a card, move to that card's column
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

    // If dropped on a column container
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

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="task-title" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Task Title
                  </Label>
                  <Input
                    id="task-title"
                    placeholder="What needs to be done?"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCard()}
                    autoFocus
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

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
