"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Check,
  Plus,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

interface TableToolProps {
  prompt: string;
  onSubmit: (content: { headers: string[]; rows: string[][] }) => void;
  initialContent?: { headers: string[]; rows: string[][] };
  isSubmitting?: boolean;
}

export function TableTool({ prompt, onSubmit, initialContent, isSubmitting }: TableToolProps) {
  // Check if we should default to the trends template based on prompt or existing state
  const isTrendsPrompt = prompt.toLowerCase().includes("trend");
  const [showConfirm, setShowConfirm] = useState(false);

  const [headers, setHeaders] = useState<string[]>(() => {
    if (initialContent?.headers && initialContent.headers.length > 0) {
      return initialContent.headers;
    }
    return isTrendsPrompt
      ? ["Trend", "Relevance", "Impact (Helps/Hurts)", "Source Link"]
      : ["Column 1", "Column 2", "Column 3"];
  });

  const [rows, setRows] = useState<string[][]>(() => {
    if (initialContent?.rows && initialContent.rows.length > 0) {
      return initialContent.rows;
    }
    return isTrendsPrompt
      ? [
          ["AI Automation", "Speeds up development cycles", "Helps", "https://google.com"],
          ["SaaS Market Saturation", "Increases customer acquisition cost", "Hurts", ""],
          ["Remote Work Preference", "Expands talent pool accessibility", "Neutral", ""],
        ]
      : [["", "", ""]];
  });

  // Keep state synchronized with prop changes
  useEffect(() => {
    if (initialContent?.headers && initialContent.headers.length > 0) {
      setHeaders(initialContent.headers);
    }
    if (initialContent?.rows && initialContent.rows.length > 0) {
      setRows(initialContent.rows);
    }
  }, [initialContent]);

  // Helper to convert index to letter (0 -> A, 1 -> B, etc.)
  const getColumnLetter = (index: number) => {
    return String.fromCharCode(65 + (index % 26));
  };

  const getColMinWidth = (header: string) => {
    const name = (header || "").toLowerCase();
    if (name.includes("relevance") || name.includes("description")) return "min-w-[260px]";
    if (name.includes("trend") || name.includes("title")) return "min-w-[200px]";
    if (name.includes("impact") || name.includes("helps")) return "min-w-[140px]";
    if (name.includes("link") || name.includes("url") || name.includes("source")) return "min-w-[220px]";
    return "min-w-[160px]";
  };

  const addColumn = () => {
    const nextLetter = getColumnLetter(headers.length);
    const newHeaders = [...headers, `Column ${nextLetter}`];
    const newRows = rows.map((row) => [...row, ""]);
    setHeaders(newHeaders);
    setRows(newRows);
    onSubmit({ headers: newHeaders, rows: newRows });
  };

  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== colIndex);
    const newRows = rows.map((row) => row.filter((_, i) => i !== colIndex));
    setHeaders(newHeaders);
    setRows(newRows);
    onSubmit({ headers: newHeaders, rows: newRows });
  };

  const addRow = () => {
    const newRows = [...rows, new Array(headers.length).fill("")];
    setRows(newRows);
    onSubmit({ headers, rows: newRows });
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== rowIndex);
    setRows(newRows);
    onSubmit({ headers, rows: newRows });
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const handleBlur = () => {
    onSubmit({ headers, rows });
  };

  const loadTrendsTemplate = () => {
    const trendsHeaders = ["Trend", "Relevance", "Impact (Helps/Hurts)", "Source Link"];
    const trendsRows = [
      ["AI Automation", "Speeds up development cycles", "Helps", "https://google.com"],
      ["SaaS Market Saturation", "Increases customer acquisition cost", "Hurts", ""],
      ["Remote Work Preference", "Expands talent pool accessibility", "Neutral", ""],
    ];
    setHeaders(trendsHeaders);
    setRows(trendsRows);
    onSubmit({ trendsHeaders, rows: trendsRows } as any);
  };

  const clearTable = () => {
    const clearedRows = [new Array(headers.length).fill("")];
    setRows(clearedRows);
    onSubmit({ headers, rows: clearedRows });
  };

  // Detect special column types for customized inputs
  const getColumnType = (headerName: string): "text" | "dropdown" | "link" => {
    const lower = headerName.toLowerCase();
    if (lower.includes("helps") || lower.includes("hurts") || lower.includes("impact") || lower.includes("status")) {
      return "dropdown";
    }
    if (lower.includes("link") || lower.includes("source") || lower.includes("url")) {
      return "link";
    }
    return "text";
  };

  return (
    <Card className="border border-white/10 bg-[#0D111A]/95 shadow-2xl rounded-2xl overflow-hidden p-5 md:p-6 space-y-6 relative">
      {/* Header section (No nested card header box) */}
      <div className="space-y-1.5 pb-2 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-md font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Venture Spreadsheet
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 max-w-xl mt-1">{prompt}</CardDescription>
        </div>
      </div>

      {/* Spreadsheet Toolbar (Clean, inline, no border card container) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-bold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Row</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addColumn}
            className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-bold flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Column</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTrendsTemplate}
            className="h-8 bg-indigo-600/10 border-indigo-500/30 hover:bg-indigo-600/20 text-xs text-indigo-300 font-bold flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Trends Template</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearTable}
            className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Table</span>
          </Button>
        </div>
      </div>

      {/* Grid Container (Rendered directly, no nested border container) */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-left">
          <thead>
            {/* Row with letters (A, B, C...) */}
            <tr className="bg-white/5 border-b border-white/10 text-center">
              <th className="w-12 border-r border-white/10 p-1 text-[10px] font-bold text-zinc-500 select-none bg-slate-900/30">#</th>
              {headers.map((header, i) => (
                <th
                  key={`letter-${i}`}
                  className="border-r border-white/5 p-1 text-[10px] font-bold text-zinc-400 select-none bg-slate-900/20"
                  style={{ minWidth: getColMinWidth(header) }}
                >
                  <div className="flex items-center justify-between px-2">
                    <span>{getColumnLetter(i)}</span>
                    {headers.length > 1 && (
                      <button
                        onClick={() => removeColumn(i)}
                        className="text-zinc-600 hover:text-red-400 transition-colors ml-1"
                        title="Delete column"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12 bg-slate-900/30 p-1 text-[10px] font-bold text-zinc-500 select-none">Action</th>
            </tr>

            {/* Editable Header Row */}
            <tr className="border-b border-white/10 bg-slate-900/20">
              <td className="border-r border-white/10 text-center text-xs font-bold text-zinc-500 select-none bg-slate-900/30">H</td>
              {headers.map((header, i) => (
                <td
                  key={`header-${i}`}
                  className="border-r border-white/5 p-1.5 focus-within:bg-indigo-500/5 transition-all"
                  style={{ minWidth: getColMinWidth(header) }}
                >
                  <Input
                    value={header}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    onBlur={handleBlur}
                    className="text-xs font-bold text-zinc-200 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-7"
                    placeholder="Header Name"
                  />
                </td>
              ))}
              <td className="bg-slate-900/30"></td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                {/* Sticky Row Number Label */}
                <td className="border-r border-white/10 text-center text-xs font-bold text-zinc-500 select-none bg-slate-900/30">
                  {rowIndex + 1}
                </td>

                {row.map((cell, colIndex) => {
                  const header = headers[colIndex] || "";
                  const colType = getColumnType(header);
                  const colMinWidth = getColMinWidth(header);

                  return (
                    <td
                      key={colIndex}
                      className="border-r border-white/5 p-1 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-indigo-500/5 transition-all"
                      style={{ minWidth: colMinWidth }}
                    >
                      {colType === "dropdown" ? (
                        <div className="relative flex items-center px-1">
                          <select
                              value={cell}
                              onChange={(e) => {
                                updateCell(rowIndex, colIndex, e.target.value);
                                onSubmit({ headers, rows: rows.map((r, ri) => ri === rowIndex ? row.map((c, ci) => ci === colIndex ? e.target.value : c) : r) });
                              }}
                              className={`w-full text-xs bg-transparent border-0 focus:outline-none cursor-pointer py-1.5 pr-6 appearance-none font-semibold ${
                                cell === "Helps"
                                  ? "text-emerald-400"
                                  : cell === "Hurts"
                                  ? "text-red-400"
                                  : "text-zinc-400"
                              }`}
                          >
                            <option value="Helps" className="bg-[#0D111A] text-emerald-400 font-semibold">Helps</option>
                            <option value="Hurts" className="bg-[#0D111A] text-red-400 font-semibold">Hurts</option>
                            <option value="Neutral" className="bg-[#0D111A] text-zinc-400 font-semibold">Neutral</option>
                          </select>
                          <ChevronDown className="absolute right-2 h-3 w-3 text-zinc-500 pointer-events-none" />
                        </div>
                      ) : colType === "link" ? (
                        <div className="flex items-center gap-1.5 px-1">
                          <Input
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            onBlur={handleBlur}
                            placeholder="https://..."
                            className="text-xs text-zinc-300 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1.5 h-7 flex-1"
                          />
                          {cell.startsWith("http") && (
                            <a
                              href={cell}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-zinc-500 hover:text-indigo-400 hover:bg-white/5 transition-all"
                              title="Open Source Link"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          onBlur={handleBlur}
                          placeholder="..."
                          className="text-xs text-zinc-300 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-7"
                        />
                      )}
                    </td>
                  );
                })}

                {/* Deletion Column */}
                <td className="p-1 text-center bg-slate-900/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(rowIndex)}
                    disabled={rows.length <= 1}
                    className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Submit Button */}
      <div className="pt-3 border-t border-white/5">
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting Table...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Submit Table</span>
            </>
          )}
        </Button>
      </div>

      {/* Yes/No Submission Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-[#0D111A]/95 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4 text-center">
            <div className="space-y-1">
              <h3 className="text-md font-bold text-white flex items-center justify-center gap-2">
                🚀 Submit Table?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to submit your trends table? This will save your responses and trigger the evaluation.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="ghost"
                className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-xl transition-all"
              >
                No, Keep Editing
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  onSubmit({ headers, rows });
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              >
                Yes, Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
