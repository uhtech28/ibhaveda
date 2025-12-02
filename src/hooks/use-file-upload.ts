"use client"

import * as React from "react"

export type FileMetadata = { name: string; size: number; type: string }
export type FileWithPreview = { id: string; file: File; preview: string }

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

type UseFileUploadOptions = {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: File[]
  onFilesChange?: (files: FileWithPreview[]) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { maxFiles = 1, maxSize = 50 * 1024 * 1024, accept = "*", multiple = false, initialFiles = [], onFilesChange } = options
  const [isDragging, setIsDragging] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [files, setFiles] = React.useState<FileWithPreview[]>([])
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (initialFiles.length) {
      const seeded = initialFiles.slice(0, maxFiles).map((file, idx) => ({ id: `${Date.now()}-${idx}`, file, preview: URL.createObjectURL(file) }))
      setFiles(seeded)
      onFilesChange?.(seeded)
    }
  }, [])

  const parseAccept = React.useMemo(() => {
    const tokens = (accept || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    return tokens
  }, [accept])

  const isTypeAllowed = (file: File) => {
    if (accept === "*" || parseAccept.length === 0) return true
    const type = (file.type || "").toLowerCase()
    const name = file.name.toLowerCase()
    for (const token of parseAccept) {
      if (token.startsWith(".")) {
        if (name.endsWith(token)) return true
      } else {
        if (token.includes("/*")) {
          const base = token.split("/")[0]
          if (type.startsWith(base + "/")) return true
        } else if (type === token) {
          return true
        } else if (token === "image/jpg" && type === "image/jpeg") {
          return true
        }
      }
    }
    return false
  }

  const addFiles = (incoming: File[]) => {
    const errs: string[] = []
    let next = [...files]
    for (const file of incoming) {
      if (next.length >= maxFiles) {
        errs.push(`Maximum ${maxFiles} file(s) allowed`)
        break
      }
      if (file.size > maxSize) {
        errs.push("File exceeds size limit")
        continue
      }
      if (!isTypeAllowed(file)) {
        errs.push("Unsupported file type")
        continue
      }
      const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, preview: URL.createObjectURL(file) }
      next.push(item)
    }
    setErrors(errs)
    setFiles(next)
    onFilesChange?.(next)
  }

  const removeFile = (id: string) => {
    const next = files.filter((f) => f.id !== id)
    setFiles(next)
    onFilesChange?.(next)
  }

  const clearFiles = () => {
    setFiles([])
    onFilesChange?.([])
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dt = e.dataTransfer
    const filesArray = dt?.files ? Array.from(dt.files) : []
    addFiles(filesArray)
  }

  const openFileDialog = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    addFiles(list)
  }

  const getInputProps = () => ({
    ref: inputRef,
    type: "file",
    multiple,
    accept,
    onChange: handleChange,
  })

  return [
    { isDragging, errors },
    { removeFile, clearFiles, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps },
  ] as const
}

