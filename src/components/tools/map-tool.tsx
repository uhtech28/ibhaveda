"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Trash2,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Image as ImageIcon,
  StickyNote,
} from "lucide-react";

interface PostIt {
  id: string;
  type: "postit";
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Shape {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Arrow {
  id: string;
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface ImageElement {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

type CanvasElement = PostIt | Shape | Arrow | ImageElement;

interface MapToolProps {
  prompt: string;
  onSubmit: (content: { elements: CanvasElement[] }) => void;
  initialContent?: { elements: CanvasElement[] };
  isSubmitting?: boolean;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#F43F5E",
  "#8B5CF6",
];

const POSTIT_COLORS = [
  "#FEF08A",
  "#BAE6FD",
  "#D9F99D",
  "#FBCFE8",
  "#FED7AA",
  "#C7D2FE",
  "#A7F3D0",
  "#FECACA",
];

type Tool =
  | "select"
  | "postit"
  | "rectangle"
  | "circle"
  | "triangle"
  | "line"
  | "arrow"
  | "image";

export function MapTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: MapToolProps) {
  const [elements, setElements] = useState<CanvasElement[]>(
    initialContent?.elements || [],
  );

  useEffect(() => {
    if (initialContent?.elements) {
      setElements(initialContent.elements);
    }
  }, [initialContent]);

  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [drawingArrow, setDrawingArrow] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tempArrow, setTempArrow] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addPostIt = () => {
    const newPostIt: PostIt = {
      id: `postit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "postit",
      x: 150 + Math.random() * 150,
      y: 100 + Math.random() * 150,
      text: "New note",
      color: POSTIT_COLORS[elements.length % POSTIT_COLORS.length],
    };
    setElements([...elements, newPostIt]);
  };

  const addShape = (type: "rectangle" | "circle" | "triangle" | "line") => {
    const newShape: Shape = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      width: type === "line" ? 100 : 80,
      height: type === "line" ? 2 : 80,
      color: selectedColor,
    };
    setElements([...elements, newShape]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newImage: ImageElement = {
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "image",
        x: 200,
        y: 150,
        width: 100,
        height: 100,
        src: event.target?.result as string,
      };
      setElements([...elements, newImage]);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeElement = (id: string) => {
    setElements(elements.filter((e) => e.id !== id));
  };

  const updateElementText = (id: string, text: string) => {
    setElements(
      elements.map((e) =>
        e.id === id && e.type === "postit" ? { ...e, text } : e,
      ),
    );
  };

  const handleMouseDown = (
    id: string,
    e: React.MouseEvent,
    isResize = false,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isResize) {
      setResizing(id);
    } else {
      setDragging(id);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === "arrow" && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDrawingArrow({ x, y });
      setTempArrow({ x1: x, y1: y, x2: x, y2: y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (dragging) {
        setElements(
          elements.map((el) => {
            if (el.id === dragging) {
              if (el.type === "arrow") {
                // For arrows, update both endpoints
                return { ...el, x1: x, x2: x + (el.x2 - el.x1) };
              } else {
                return { ...el, x, y };
              }
            }
            return el;
          }),
        );
      } else if (resizing) {
        setElements(
          elements.map((el) => {
            if (
              el.id === resizing &&
              el.type !== "postit" &&
              el.type !== "arrow"
            ) {
              const newWidth = Math.max(30, x - el.x);
              const newHeight = Math.max(30, y - el.y);
              return { ...el, width: newWidth, height: newHeight };
            }
            return el;
          }),
        );
      } else if (drawingArrow) {
        setTempArrow({ x1: drawingArrow.x, y1: drawingArrow.y, x2: x, y2: y });
      }
    },
    [dragging, resizing, drawingArrow, elements],
  );

  const handleMouseUp = (e: React.MouseEvent) => {
    if (drawingArrow && tempArrow && canvasRef.current) {
      const newArrow: Arrow = {
        id: `arrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "arrow",
        x1: tempArrow.x1,
        y1: tempArrow.y1,
        x2: tempArrow.x2,
        y2: tempArrow.y2,
        color: selectedColor,
      };
      setElements([...elements, newArrow]);
      setDrawingArrow(null);
      setTempArrow(null);
    }
    setDragging(null);
    setResizing(null);
  };

  const handleSubmit = () => {
    if (elements.length === 0) return;
    onSubmit({ elements });
  };

  const renderArrowHead = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
  ) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 12;

    const point1X = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
    const point1Y = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
    const point2X = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
    const point2Y = y2 - arrowLength * Math.sin(angle + Math.PI / 6);

    return (
      <polygon
        points={`${x2},${y2} ${point1X},${point1Y} ${point2X},${point2Y}`}
        fill={color}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          <CardTitle>Canvas & Map</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs font-semibold">Tools:</Label>
            <Button
              variant={selectedTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("select")}
              className="h-8"
            >
              Select
            </Button>
            <Button
              variant={selectedTool === "postit" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTool("postit");
                addPostIt();
              }}
              className="h-8"
            >
              <StickyNote className="h-3 w-3 mr-1" />
              Post-it
            </Button>
            <Button
              variant={selectedTool === "rectangle" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTool("rectangle");
                addShape("rectangle");
              }}
              className="h-8"
            >
              <Square className="h-3 w-3 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={selectedTool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTool("circle");
                addShape("circle");
              }}
              className="h-8"
            >
              <Circle className="h-3 w-3 mr-1" />
              Circle
            </Button>
            <Button
              variant={selectedTool === "triangle" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedTool("triangle");
                addShape("triangle");
              }}
              className="h-8"
            >
              <Triangle className="h-3 w-3 mr-1" />
              Triangle
            </Button>
            <Button
              variant={selectedTool === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("arrow")}
              className="h-8"
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Arrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Color:</Label>
            <div className="flex gap-1 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border-2 ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  } transition-transform`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="w-full overflow-x-auto border-2 rounded-lg bg-white dark:bg-slate-950 scrollbar-thin">
          <div
            ref={canvasRef}
            className="relative w-[800px] h-[400px] overflow-hidden cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleCanvasMouseDown}
          >
          {/* SVG Layer for shapes and arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Render arrows */}
            {elements.map((el) => {
              if (el.type === "arrow") {
                return (
                  <g key={el.id}>
                    <line
                      x1={el.x1}
                      y1={el.y1}
                      x2={el.x2}
                      y2={el.y2}
                      stroke={el.color}
                      strokeWidth="3"
                    />
                    {renderArrowHead(el.x1, el.y1, el.x2, el.y2, el.color)}
                  </g>
                );
              }
              return null;
            })}

            {/* Temporary arrow while drawing */}
            {tempArrow && (
              <g>
                <line
                  x1={tempArrow.x1}
                  y1={tempArrow.y1}
                  x2={tempArrow.x2}
                  y2={tempArrow.y2}
                  stroke={selectedColor}
                  strokeWidth="3"
                  strokeDasharray="4"
                />
                {renderArrowHead(
                  tempArrow.x1,
                  tempArrow.y1,
                  tempArrow.x2,
                  tempArrow.y2,
                  selectedColor,
                )}
              </g>
            )}

            {/* Render shapes */}
            {elements.map((el) => {
              if (el.type === "rectangle") {
                return (
                  <rect
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={el.color}
                    fillOpacity="0.6"
                    stroke={el.color}
                    strokeWidth="2"
                  />
                );
              } else if (el.type === "circle") {
                return (
                  <ellipse
                    key={el.id}
                    cx={el.x + el.width / 2}
                    cy={el.y + el.height / 2}
                    rx={el.width / 2}
                    ry={el.height / 2}
                    fill={el.color}
                    fillOpacity="0.6"
                    stroke={el.color}
                    strokeWidth="2"
                  />
                );
              } else if (el.type === "triangle") {
                const x1 = el.x + el.width / 2;
                const y1 = el.y;
                const x2 = el.x;
                const y2 = el.y + el.height;
                const x3 = el.x + el.width;
                const y3 = el.y + el.height;
                return (
                  <polygon
                    key={el.id}
                    points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                    fill={el.color}
                    fillOpacity="0.6"
                    stroke={el.color}
                    strokeWidth="2"
                  />
                );
              } else if (el.type === "line") {
                return (
                  <line
                    key={el.id}
                    x1={el.x}
                    y1={el.y + el.height / 2}
                    x2={el.x + el.width}
                    y2={el.y + el.height / 2}
                    stroke={el.color}
                    strokeWidth="3"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Post-its and Images (HTML elements) */}
          {elements.map((el) => {
            if (el.type === "postit") {
              return (
                <div
                  key={el.id}
                  className={`absolute cursor-move select-none group`}
                  style={{ left: el.x, top: el.y }}
                  onMouseDown={(e) => handleMouseDown(el.id, e)}
                >
                  <div
                    className="min-w-[100px] p-2 rounded shadow-md border-l-4"
                    style={{
                      backgroundColor: el.color,
                      borderLeftColor: el.color.replace("A", "6"),
                    }}
                  >
                    <Input
                      value={el.text}
                      onChange={(e) => updateElementText(el.id, e.target.value)}
                      className="h-auto text-xs border-0 bg-transparent focus-visible:ring-0 p-0 min-w-20"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(el.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            } else if (el.type === "image") {
              return (
                <div
                  key={el.id}
                  className="absolute cursor-move select-none group border-2 border-dashed border-transparent hover:border-primary"
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                  }}
                  onMouseDown={(e) => handleMouseDown(el.id, e)}
                >
                  <img
                    src={el.src}
                    alt="Canvas"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(el.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-primary opacity-0 group-hover:opacity-100 cursor-nwse-resize"
                    onMouseDown={(e) => handleMouseDown(el.id, e, true)}
                  />
                </div>
              );
            } else if (el.type !== "arrow") {
              // Shapes with resize handle
              return (
                <div
                  key={el.id}
                  className="absolute cursor-move select-none group pointer-events-auto"
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                  }}
                  onMouseDown={(e) => handleMouseDown(el.id, e)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(el.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-primary opacity-0 group-hover:opacity-100 cursor-nwse-resize z-10"
                    onMouseDown={(e) => handleMouseDown(el.id, e, true)}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted/30 rounded">
          <p>• Click tools to add post-its, shapes, or images</p>
          <p>• Select "Arrow" and click-drag on canvas to draw arrows</p>
          <p>• Drag elements to move them, drag corner to resize</p>
          <p>• Hover over elements to see delete button</p>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">
            {elements.length} {elements.length === 1 ? "element" : "elements"}{" "}
            on canvas
          </span>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={elements.length === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit Canvas ({elements.length}{" "}
              {elements.length === 1 ? "element" : "elements"})
            </>
          )}
        </Button>

        {elements.length === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Add at least one element to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
