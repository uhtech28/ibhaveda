"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2 } from "lucide-react"

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

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`])
    setRows(rows.map((row) => [...row, ""]))
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

  const handleSubmit = () => {
    onSubmit({ headers, rows })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Your Table</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th key={i} className="border p-2 min-w-[120px]">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                      className="text-sm font-medium border-0 bg-transparent focus-visible:ring-0"
                    />
                  </th>
                ))}
                <th className="border p-2 w-10">
                  <Button variant="ghost" size="icon" onClick={addColumn} className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border p-2">
                      <Input
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className="text-sm border-0 bg-transparent focus-visible:ring-0"
                        placeholder={`Row ${rowIndex + 1}`}
                      />
                    </td>
                  ))}
                  <td className="border p-2 w-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(rowIndex)}
                      disabled={rows.length <= 1}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" onClick={addRow} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
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
