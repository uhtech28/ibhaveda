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
} from "lucide-react";
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
        <div className="space-y-2 min-h-[200px] p-2 border-2 border-dashed border-muted rounded-lg">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-xs text-muted-foreground">
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

  const handleMoveCard = (cardId: string, newColumn: "todo" | "inprogress" | "done") => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, column: newColumn } : card
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
    };
    setCards([...cards, newCard]);
    setNewCardTitle("");
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
            ? { ...card, column: overCard.column }
            : card,
        ),
      );
    }

    // Check if we're over a column (by checking if over.id matches column id)
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn && overColumn.id !== activeCard.column) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id ? { ...card, column: overColumn.id } : card,
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
            ? { ...card, column: overCard.column }
            : card,
        ),
      );
    }

    // If dropped on a column container
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === activeCard.id ? { ...card, column: overColumn.id } : card,
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          <CardTitle>Kanban Board</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Card Section */}
        <div className="space-y-2">
          <Label>Add New Card</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter task or item..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCard()}
            />
            <select
              value={activeColumn}
              onChange={(e) =>
                setActiveColumn(
                  e.target.value as "todo" | "inprogress" | "done",
                )
              }
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <Button
              onClick={addCard}
              size="icon"
              disabled={!newCardTitle.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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
                    ? "bg-indigo-500 text-white shadow-sm"
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

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-3">
            Total cards: {cards.length} | Drag and drop cards between columns
          </p>
          <Button
            onClick={handleSubmit}
            disabled={cards.length === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isStandalone ? "Saving..." : "Submitting..."}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isStandalone ? "Save Board" : "Submit Board"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
