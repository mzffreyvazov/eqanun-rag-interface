"use client"

import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Loader2, Upload, FileText } from "lucide-react"

interface UploadProgressProps {
  progress: number
  totalFiles: number
  completedFiles: number
  demoMode: boolean
}

export function UploadProgress({ progress, totalFiles, completedFiles, demoMode }: UploadProgressProps) {
  const isCompleted = completedFiles === totalFiles
  
  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm">
                {isCompleted 
                  ? "Upload Complete!" 
                  : demoMode 
                    ? "Simulating Upload & Processing..." 
                    : "Uploading & Processing Documents..."
                }
              </h3>
              <p className="text-xs text-muted-foreground">
                {completedFiles} of {totalFiles} files processed
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Complete
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-3 bg-blue-100 dark:bg-blue-900/30" 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processing documents...</span>
            <span>{completedFiles}/{totalFiles} files</span>
          </div>
        </div>

        {demoMode && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
            Demo mode: Simulating realistic upload and processing times
          </div>
        )}
      </div>
    </Card>
  )
}