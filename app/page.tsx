"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Send, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadDialog } from "@/components/upload/FileUploadDialog"
import { ChatSidebar } from "@/components/chat/ChatSidebar"

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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize with API health check and auto-retry
  useEffect(() => {
    fetchSystemStatus()
    // Auto-retry every 10 seconds if API is down
    const interval = setInterval(() => {
      if (apiError) {
        fetchSystemStatus()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [apiError])

  // Initialize with a default session
  useEffect(() => {
    if (chatSessions.length === 0) {
      const defaultSession: ChatSession = {
        id: "default",
        title: "New Chat",
        messages: [],
        lastActivity: new Date(),
      }
      setChatSessions([defaultSession])
      setMessages([])
    }
  }, [chatSessions.length])

  const fetchSystemStatus = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setSystemStatus(data)
      setApiError(null)
      console.log("API Status:", data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to API"
      console.warn("API connection failed:", errorMessage)
      setApiError(errorMessage)
      setSystemStatus(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || apiError) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    const currentInput = input
    setInput("")
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const requestBody = {
        message: currentInput,
        ...(sessionId && { session_id: sessionId })
      }

      console.log("Sending chat request:", requestBody)

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Chat response:", result)

      // Update session ID if we got a new one
      let newSessionId = sessionId
      if (result.session_id) {
        newSessionId = result.session_id
        setSessionId(result.session_id)
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)

      // Update current session
      const updatedSessions = [...chatSessions]
      updatedSessions[currentSessionIndex] = {
        ...updatedSessions[currentSessionIndex],
        id: newSessionId || updatedSessions[currentSessionIndex].id,
        messages: finalMessages,
        title:
          finalMessages.length === 2 ? currentInput.slice(0, 30) + "..." : updatedSessions[currentSessionIndex].title,
        lastActivity: new Date(),
      }
      setChatSessions(updatedSessions)
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please make sure the API server is running and has documents uploaded.`,
        timestamp: new Date(),
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    // Validate file types
    const pdfFiles = files.filter(file => file.type === "application/pdf")
    if (pdfFiles.length === 0) {
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ Please upload only PDF files. Other file types are not supported.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    if (pdfFiles.length !== files.length) {
      const warningMessage: Message = {
        role: "assistant",
        content: `⚠️ ${files.length - pdfFiles.length} non-PDF files were skipped. Only uploading ${pdfFiles.length} PDF file(s).`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, warningMessage])
    }

    try {
      const formData = new FormData()

      pdfFiles.forEach((file) => {
        formData.append("files", file)
      })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for uploads

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Upload result:", result)

      // Refresh system status
      await fetchSystemStatus()

      // Add system message about successful upload
      const systemMessage: Message = {
        role: "assistant",
        content: `✅ ${result.message}
Files processed: ${result.files_processed.join(", ")}
Total documents in system: ${result.total_documents}

You can now ask questions about these documents!`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
    } catch (error) {
      console.error("Upload failed:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}. Please make sure the API server is running and try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      lastActivity: new Date(),
    }
    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionIndex(0)
    setMessages([])
    setSessionId("")
  }

  const switchToSession = (index: number) => {
    setCurrentSessionIndex(index)
    setMessages(chatSessions[index].messages)
    setSessionId(chatSessions[index].id)
  }

  const deleteSession = (index: number) => {
    if (chatSessions.length <= 1) return // Don't delete the last session

    const updatedSessions = chatSessions.filter((_, i) => i !== index)
    setChatSessions(updatedSessions)

    // Adjust current session index if necessary
    if (index === currentSessionIndex) {
      // If deleting current session, switch to the first available session
      const newIndex = 0
      setCurrentSessionIndex(newIndex)
      setMessages(updatedSessions[newIndex].messages)
      setSessionId(updatedSessions[newIndex].id)
    } else if (index < currentSessionIndex) {
      // If deleting a session before current, adjust index
      setCurrentSessionIndex(currentSessionIndex - 1)
    }
  }

  const clearAllDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Refresh system status
      await fetchSystemStatus()

      const systemMessage: Message = {
        role: "assistant",
        content: "🗑️ All documents have been cleared from the system. You can upload new documents to start fresh.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
    } catch (error) {
      console.error("Clear documents failed:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Failed to clear documents: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground dark">
      {/* Left Sidebar */}
      <ChatSidebar
        chatSessions={chatSessions}
        currentSessionIndex={currentSessionIndex}
        onNewChat={startNewChat}
        onSwitchSession={switchToSession}
        onDeleteSession={deleteSession}
        apiError={apiError}
        systemStatus={systemStatus}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Legal Document Assistant</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered legal document analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            {systemStatus?.documents_count > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllDocuments}
                className="gap-2 bg-transparent text-destructive hover:text-destructive cursor-pointer"
                disabled={!!apiError}
              >
                <AlertCircle className="w-4 h-4" />
                Clear All
              </Button>
            )}
            <FileUploadDialog
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
              onUploadComplete={handleFileUpload}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent cursor-pointer"
              onClick={() => setUploadDialogOpen(true)}
              disabled={!!apiError}
            >
              <Upload className="w-4 h-4" />
              Upload PDFs
            </Button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 border-b border-border">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot connect to API server at {API_BASE_URL}.
                <br />
                <strong>To fix this issue:</strong>
                <br />
                1. Make sure your FastAPI server is running: <code className="bg-muted px-1 rounded">python main.py</code>
                <br />
                2. Check if the server is accessible at <code className="bg-muted px-1 rounded">{API_BASE_URL}</code>
                <br />
                3. Verify CORS settings allow requests from this domain
                <br />
                4. Try refreshing the page to retry
                <br />
                <span className="text-xs text-muted-foreground">Auto-retrying every 10 seconds...</span>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {systemStatus && systemStatus.documents_count === 0 && !apiError && (
          <div className="p-4 border-b border-border">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>No documents uploaded yet</strong> - Upload PDF documents to start asking questions about legal content.
                Use the "Upload PDFs" button above to get started.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl font-semibold mb-4">What can I help you with today?</div>
                <div className="text-muted-foreground mb-8">
                  Ask questions about your uploaded legal documents
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user" ? "bg-primary text-primary-foreground ml-12" : "bg-muted mr-12"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4 mr-12">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={
                  apiError
                    ? "Connect to API to start chatting..."
                    : "Ask anything about your legal documents..."
                }
                disabled={loading || !!apiError}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !!apiError}
                size="icon"
                className="cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {apiError
                ? "Connect to API to enable chat"
                : "Press Enter to send, Shift+Enter for new line"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}