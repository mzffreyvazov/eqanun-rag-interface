"use client"

import { useState, useRef, DragEvent } from "react"
import { FileText, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadAreaProps {
  onFilesSelected: (files: FileList) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  disabled?: boolean
}

export function FileUploadArea({ onFilesSelected, fileInputRef, disabled }: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-accent/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"}
          `}>
            {isDragOver ? (
              <Plus className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragOver ? "Drop your PDF files here" : "Upload PDF Documents"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {isDragOver 
                ? "Release to add these files to your upload queue"
                : "Drag and drop your PDF files here, or click to browse and select files"
              }
            </p>
          </div>

          {!isDragOver && (
            <Button variant="outline" className="gap-2 mt-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Browse Files
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
      />

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Only PDF files are supported. Maximum file size: 50MB per file.
        </p>
      </div>
    </div>
  )
}