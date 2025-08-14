"use client"

import { useEffect, useState, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface FileStatus {
  filename: string
  pages_total: number | null
  chunks_total: number | null
  chunks_done: number
  percent: number
  status: "pending" | "running" | "completed" | "failed"
  error: string | null
}

interface UploadStatusResponse {
  job_id: string
  status: "pending" | "running" | "completed" | "failed"
  files: Record<string, FileStatus>
  overall: {
    percent: number
    chunks_total: number
    chunks_done: number
  }
  error: string | null
}

interface UploadProgressProps {
  jobId: string
  apiBaseUrl?: string
  onCompleted?: (res: UploadStatusResponse) => void
}

export function UploadProgress({ jobId, apiBaseUrl, onCompleted }: UploadProgressProps) {
  const [status, setStatus] = useState<UploadStatusResponse | null>(null)
  const pollingRef = useRef<number | null>(null)

  const base = apiBaseUrl || (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")

  useEffect(() => {
    let mounted = true

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/upload/status/${jobId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: UploadStatusResponse = await res.json()
        if (!mounted) return
        setStatus(data)
        if (data.status === "completed" || data.status === "failed") {
          if (onCompleted) onCompleted(data)
          // stop polling
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch (err) {
        console.warn("Failed to fetch upload status:", err)
      }
    }

    // initial fetch
    fetchStatus()

    // poll every 1s
    pollingRef.current = window.setInterval(fetchStatus, 1000)

    return () => {
      mounted = false
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [jobId, base, onCompleted])

  const overallPercent = status?.overall?.percent ?? 0
  const files = status ? Object.values(status.files) : []

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            {/* Only show minimal info: primary filename */}
            <div>
              <h3 className="font-semibold text-sm">{files[0]?.filename ?? "Processing document..."}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(overallPercent)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={overallPercent} className="h-3 bg-blue-100 dark:bg-blue-900/30" />
        </div>

        {/* Optionally show file list without per-file progress bars */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.filename} className="flex items-center justify-between p-2">
                <div className="text-sm truncate">{f.filename}</div>
                <div className="text-xs text-muted-foreground">{f.status} — {Math.round(f.percent)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}