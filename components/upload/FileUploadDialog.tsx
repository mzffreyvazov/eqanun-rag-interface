"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2, Plus } from "lucide-react"
import { FileUploadArea } from "./FileUploadArea"
import { UploadProgress } from "./UploadProgress"

interface UploadFile {
  file: File
  id: string
  status: "pending" | "uploading" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (files: File[]) => Promise<void>
  demoMode?: boolean
}

export function FileUploadDialog({ open, onOpenChange, onUploadComplete, demoMode = false }: FileUploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf")
    
    if (pdfFiles.length === 0) {
      return
    }

    const newUploadFiles: UploadFile[] = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0
    }))

    setUploadFiles(newUploadFiles)
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id))
  }

  const startUpload = async () => {
    if (uploadFiles.length === 0) return

    setIsUploading(true)
    setOverallProgress(0)

    try {
      // Update all files to uploading status
      setUploadFiles(prev => prev.map(file => ({ ...file, status: "uploading" as const })))

      // Simulate upload progress for each file
      for (let i = 0; i < uploadFiles.length; i++) {
        const fileId = uploadFiles[i].id

        // Upload phase
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadFiles(prev => prev.map(file => 
            file.id === fileId ? { ...file, progress } : file
          ))
        }

        // Processing phase
        setUploadFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, status: "processing", progress: 0 } : file
        ))

        // Simulate processing time
        const processingTime = 5000
        for (let progress = 0; progress <= 100; progress += 5) {
          await new Promise(resolve => setTimeout(resolve, processingTime / 20))
          setUploadFiles(prev => prev.map(file => 
            file.id === fileId ? { ...file, progress } : file
          ))
        }

        // Mark as completed
        setUploadFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, status: "completed", progress: 100 } : file
        ))

        // Update overall progress
        setOverallProgress(((i + 1) / uploadFiles.length) * 100)
      }

      // Call the completion handler
      await onUploadComplete(uploadFiles.map(uf => uf.file))

      // Auto-close after a brief delay
      setTimeout(() => {
        onOpenChange(false)
        resetUpload()
      }, 1500)

    } catch (error) {
      console.error("Upload failed:", error)
      setUploadFiles(prev => prev.map(file => ({ 
        ...file, 
        status: "error", 
        error: error instanceof Error ? error.message : "Upload failed" 
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadFiles([])
    setIsUploading(false)
    setOverallProgress(0)
  }

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false)
      resetUpload()
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="w-4 h-4 text-muted-foreground" />
      case "uploading":
        return <Upload className="w-4 h-4 text-blue-500" />
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getStatusText = (status: UploadFile["status"]) => {
    switch (status) {
      case "pending":
        return "Ready to upload"
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing document..."
      case "completed":
        return "Completed"
      case "error":
        return "Failed"
    }
  }

  const getStatusColor = (status: UploadFile["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "uploading":
        return "default"
      case "processing":
        return "default"
      case "completed":
        return "default"
      case "error":
        return "destructive"
    }
  }

  const allCompleted = uploadFiles.length > 0 && uploadFiles.every(file => file.status === "completed")
  const hasErrors = uploadFiles.some(file => file.status === "error")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload PDF Documents
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-hidden">
          {uploadFiles.length === 0 ? (
            <FileUploadArea
              onFilesSelected={handleFilesSelected}
              fileInputRef={fileInputRef}
              disabled={isUploading}
              demoMode={demoMode}
            />
          ) : (
            <div className="space-y-4">
              {isUploading && (
                <UploadProgress 
                  progress={overallProgress}
                  totalFiles={uploadFiles.length}
                  completedFiles={uploadFiles.filter(f => f.status === "completed").length}
                  demoMode={demoMode}
                />
              )}

              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {uploadFiles.map((uploadFile) => (
                    <Card key={uploadFile.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getStatusIcon(uploadFile.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {uploadFile.file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                          <Badge variant={getStatusColor(uploadFile.status)} className="text-xs">
                            {getStatusText(uploadFile.status)}
                          </Badge>
                        </div>
                        {!isUploading && uploadFile.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                            className="ml-2 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {(uploadFile.status === "uploading" || uploadFile.status === "processing") && (
                        <div className="mt-3">
                          <Progress value={uploadFile.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {uploadFile.status === "uploading" ? "Uploading" : "Processing"} - {uploadFile.progress}%
                          </div>
                        </div>
                      )}

                      {uploadFile.error && (
                        <div className="mt-2 text-xs text-destructive">
                          {uploadFile.error}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {!isUploading && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add More Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {uploadFiles.length > 0 && (
              <>
                {uploadFiles.length} file{uploadFiles.length !== 1 ? "s" : ""} selected
                {allCompleted && " - All completed!"}
                {hasErrors && " - Some files failed"}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              {allCompleted ? "Done" : "Cancel"}
            </Button>
            {uploadFiles.length > 0 && !isUploading && !allCompleted && (
              <Button onClick={startUpload} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}