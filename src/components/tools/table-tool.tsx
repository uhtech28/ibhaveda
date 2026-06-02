"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2, Upload, Table } from "lucide-react"

interface TableToolProps {
  prompt: string
  onSubmit: (content: { headers: string[]; rows: string[][] }) => void
  initialContent?: { headers: string[]; rows: string[][] }
  isSubmitting?: boolean
}

export function TableTool({ prompt, onSubmit, initialContent, isSubmitting }: TableToolProps) {
  const [headers, setHeaders] = useState<string[]>(
    initialContent?.headers || ["Column 1", "Column 2", "Column 3"]
  )
  const [rows, setRows] = useState<string[][]>(
    initialContent?.rows || [["", "", ""]]
  )

  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`])
    setRows(rows.map((row) => [...row, ""]))
  }

  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return
    setHeaders(headers.filter((_, i) => i !== colIndex))
    setRows(rows.map((row) => row.filter((_, i) => i !== colIndex)))
  }

  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill("")])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = value
    setHeaders(newHeaders)
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows]
    newRows[rowIndex][colIndex] = value
    setRows(newRows)
  }

  const handleImport = () => {
    if (!importText.trim()) return
    const lines = importText.trim().split("\n")
    if (lines.length === 0) return

    const firstLine = lines[0]
    const delimiter = firstLine.includes("\t") ? "\t" : ","

    // Parse headers
    const parsedHeaders = firstLine.split(delimiter).map(h => h.trim() || `Col`)
    
    // Parse rows
    const parsedRows = lines.slice(1).map(line => {
      const parts = line.split(delimiter).map(cell => cell.trim())
      while (parts.length < parsedHeaders.length) {
        parts.push("")
      }
      return parts.slice(0, parsedHeaders.length)
    })

    setHeaders(parsedHeaders)
    setRows(parsedRows.length > 0 ? parsedRows : [new Array(parsedHeaders.length).fill("")])
    setImportText("")
    setShowImport(false)
  }

  const handleSubmit = () => {
    onSubmit({ headers, rows })
  }

  const getColLetter = (index: number) => {
    return String.fromCharCode(65 + (index % 26))
  }

  return (
    <Card className="bg-transparent border-0 shadow-none p-0">
      <CardHeader className="hidden">
        <CardTitle>Build Your Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-0">
        
        {/* Toggleable Import utility */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-wider">
              <Table className="w-4 h-4 text-indigo-400" />
              <span>Spreadsheet Grid</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImport(!showImport)}
              className="h-7 px-2.5 rounded-lg border-white/10 bg-white/[0.02] text-[10px] font-bold text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              {showImport ? "Close Import" : "Paste from Excel / CSV"}
            </Button>
          </div>

          {showImport && (
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3.5 transition-all">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-zinc-300">Bulk Paste Spreadsheet Data</Label>
                <p className="text-[10px] text-zinc-500">
                  Copy cells from Excel, Google Sheets, or a CSV file and paste below. The first row will be used as headers.
                </p>
              </div>
              <Textarea
                placeholder="Header1,Header2,Header3&#10;Row1Col1,Row1Col2,Row1Col3&#10;Row2Col1,Row2Col2,Row2Col3"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                className="bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
              />
              <Button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-all"
              >
                Parse & Populate Table
              </Button>
            </div>
          )}
        </div>

        {/* Spreadsheet Editor grid */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="w-10 text-center text-[10px] font-bold text-zinc-500 border-r border-white/10 select-none py-2">
                    #
                  </th>
                  {headers.map((header, i) => (
                    <th key={i} className="group relative border-r border-white/10 min-w-[140px] px-1 py-1">
                      <div className="absolute top-0 left-0 right-0 text-[8px] text-center font-bold text-zinc-500 select-none pt-0.5">
                        {getColLetter(i)}
                      </div>
                      <div className="flex items-center gap-1 mt-2.5">
                        <Input
                          value={header}
                          onChange={(e) => updateHeader(i, e.target.value)}
                          className="h-7 text-xs font-bold border-0 bg-transparent focus-visible:ring-0 text-zinc-200 px-1 py-0"
                        />
                        <button
                          onClick={() => removeColumn(i)}
                          disabled={headers.length <= 1}
                          className="opacity-0 group-hover:opacity-100 disabled:opacity-0 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                          title="Delete column"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="w-10 p-1 text-center">
                    <button
                      onClick={addColumn}
                      className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-300 transition-colors mx-auto"
                      title="Add column"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <td className="w-10 text-center text-[10px] font-bold text-zinc-500 border-r border-white/10 bg-white/[0.01] select-none py-2">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border-r border-white/10 p-1">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 text-zinc-300 placeholder:text-zinc-600 px-1 py-0"
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="w-10 p-1 text-center">
                      <button
                        onClick={() => removeRow(rowIndex)}
                        disabled={rows.length <= 1}
                        className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors mx-auto"
                        title="Delete row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-white/[0.01] border-t border-white/10 flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={addRow}
              className="h-7 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/5 px-3 rounded-lg"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
              Add Row
            </Button>
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-900/20 active:scale-[0.99] transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Table Data...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit Table
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
