"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, MessageSquare, Trash, Wifi, WifiOff, AlertCircle } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  lastActivity: Date
}

interface ChatSidebarProps {
  chatSessions: ChatSession[]
  currentSessionIndex: number
  onNewChat: () => void
  onSwitchSession: (index: number) => void
  onDeleteSession: (index: number) => void
  apiError: string | null
  systemStatus: any
}

export function ChatSidebar({
  chatSessions,
  currentSessionIndex,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  apiError,
  systemStatus
}: ChatSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null)

  const handleDeleteClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessionToDelete(index)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (sessionToDelete !== null) {
      onDeleteSession(sessionToDelete)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  return (
    <>
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mb-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chatSessions.map((session, index) => (
              <div
                key={session.id}
                className="group relative"
              >
                <Button
                  variant={index === currentSessionIndex ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent pr-10 cursor-pointer"
                  onClick={() => onSwitchSession(index)}
                >
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-sm">{session.title}</span>
                </Button>
                
                {chatSessions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity cursor-pointer"
                    onClick={(e) => handleDeleteClick(index, e)}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground space-y-1">
            {apiError ? (
              <>
                <div className="flex items-center gap-1 text-destructive">
                  <WifiOff className="w-3 h-3" />
                  API: Offline
                </div>
                <div className="text-[10px] break-words">{apiError}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Retrying every 10s...
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-green-500">
                  <Wifi className="w-3 h-3" />
                  API: Connected
                </div>
                <div>Status: {systemStatus?.status || "Unknown"}</div>
                <div>Documents: {systemStatus?.documents_count || systemStatus?.total_documents || 0}</div>
                {systemStatus?.collection_exists === false && (
                  <div className="text-[10px] text-yellow-500">No documents uploaded</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Chat Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat session? This action cannot be undone.
              {sessionToDelete !== null && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>"{chatSessions[sessionToDelete]?.title}"</strong>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} className="cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="cursor-pointer">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}