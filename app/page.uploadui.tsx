"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogTrigger } from "@/components/ui/dialog"
import { Upload, Send, FileText, Plus, MessageSquare, AlertCircle, Play, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadDialog } from "@/components/upload/FileUploadDialog"

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
  const [uploading, setUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0)
  const [demoMode, setDemoMode] = useState(true) // Start in demo mode by default

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Demo responses for offline mode
  const demoResponses = [
    "Based on the legal documents, employment contracts in Azerbaijan must include specific provisions regarding working hours, compensation, and termination procedures. The Labor Code requires that all employment relationships be formalized through written contracts.",
    "According to the uploaded legal documents, contract termination procedures must follow a specific protocol: 1) Written notice must be provided, 2) The notice period depends on the type of contract, 3) Severance pay may be required in certain circumstances.",
    "The key provisions in employment law include: worker rights protection, minimum wage requirements, working time limitations (40 hours per week standard), overtime compensation, annual leave entitlements, and workplace safety regulations.",
    "Legal document analysis shows that dispute resolution typically follows these steps: 1) Internal company procedures, 2) Labor inspection involvement, 3) Court proceedings if necessary. Alternative dispute resolution methods are also available.",
    "The contract law framework requires that all agreements be in writing for enforceability. Key elements include: offer and acceptance, consideration, legal capacity of parties, and lawful purpose. Breach of contract remedies include damages, specific performance, or contract rescission.",
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize with API health check and auto-retry
  useEffect(() => {
    if (!demoMode) {
      fetchSystemStatus()
      // Auto-retry every 10 seconds if API is down
      const interval = setInterval(() => {
        if (apiError) {
          fetchSystemStatus()
        }
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [demoMode, apiError])

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
    if (demoMode) {
      setSystemStatus({ status: "demo", documents_count: 25, collection_exists: true })
      setApiError(null)
      return
    }

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
    if (!input.trim() || loading) return

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
      let assistantResponse: string
      let newSessionId = sessionId

      if (demoMode) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

        // Generate demo response based on input
        if (currentInput.toLowerCase().includes("employment")) {
          assistantResponse = demoResponses[0]
        } else if (currentInput.toLowerCase().includes("termination")) {
          assistantResponse = demoResponses[1]
        } else if (currentInput.toLowerCase().includes("provision")) {
          assistantResponse = demoResponses[2]
        } else if (currentInput.toLowerCase().includes("dispute")) {
          assistantResponse = demoResponses[3]
        } else if (currentInput.toLowerCase().includes("contract")) {
          assistantResponse = demoResponses[4]
        } else {
          assistantResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
        }
      } else {
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
        if (result.session_id) {
          newSessionId = result.session_id
          setSessionId(result.session_id)
        }

        assistantResponse = result.response
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: assistantResponse,
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
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. ${!demoMode ? "Please make sure the API server is running and has documents uploaded." : ""}`,
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
      if (demoMode) {
        // Add demo success message
        const systemMessage: Message = {
          role: "assistant",
          content: `✅ Successfully uploaded ${pdfFiles.length} document(s) in demo mode: ${pdfFiles
            .map((f) => f.name)
            .join(", ")}. You can now ask questions about these documents!`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, systemMessage])
      } else {
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
      }
    } catch (error) {
      console.error("Upload failed:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}. ${!demoMode ? "Please make sure the API server is running and try again." : ""}`,
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

  const toggleDemoMode = async () => {
    const newDemoMode = !demoMode
    setDemoMode(newDemoMode)

    if (newDemoMode) {
      setApiError(null)
      setSystemStatus({ status: "demo", documents_count: 25, collection_exists: true })
    } else {
      setSystemStatus(null)
      await fetchSystemStatus()
    }
  }

  const clearAllDocuments = async () => {
    if (demoMode) {
      // Demo mode - just show a message
      const systemMessage: Message = {
        role: "assistant",
        content: "🗑️ In demo mode, document clearing is simulated. All demo documents would be cleared.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, systemMessage])
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
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
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <Button
            onClick={startNewChat}
            className="w-full justify-start gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 mb-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <Button
            onClick={toggleDemoMode}
            variant={demoMode ? "default" : "outline"}
            className="w-full justify-start gap-2 text-xs"
            size="sm"
          >
            {demoMode ? <Play className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            {demoMode ? "Demo Mode" : "Connect to API"}
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chatSessions.map((session, index) => (
              <Button
                key={session.id}
                variant={index === currentSessionIndex ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto p-3 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => switchToSession(index)}
              >
                <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate text-sm">{session.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground space-y-1">
            {demoMode ? (
              <>
                <div className="flex items-center gap-1 text-blue-400">
                  <Play className="w-3 h-3" />
                  Demo Mode
                </div>
                <div>Documents: 25 (simulated)</div>
                <div className="text-[10px] text-blue-400">Offline responses</div>
              </>
            ) : apiError ? (
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Legal Document Assistant</h1>
            <p className="text-sm text-muted-foreground">
              {demoMode ? "Demo Mode - Simulated responses" : "AI-powered legal document analysis"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!demoMode && systemStatus?.documents_count > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllDocuments}
                className="gap-2 bg-transparent text-destructive hover:text-destructive"
              >
                <AlertCircle className="w-4 h-4" />
                Clear All
              </Button>
            )}
            <FileUploadDialog
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
              onUploadComplete={handleFileUpload}
              demoMode={demoMode}
            />
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="w-4 h-4" />
                Upload PDFs
              </Button>
            </DialogTrigger>
          </div>
        </div>

        {!demoMode && apiError && (
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
                4. Try refreshing the page or click "Connect to API" to retry
                <br />
                <span className="text-xs text-muted-foreground">Auto-retrying every 10 seconds...</span>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!demoMode && systemStatus && systemStatus.documents_count === 0 && !apiError && (
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

        {demoMode && (
          <div className="p-4 border-b border-border">
            <Alert>
              <Play className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Mode Active</strong> - Experience the interface with simulated responses. Click "Demo Mode"
                to switch to live API when ready.
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
                  {demoMode && " (Demo responses)"}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Card
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInput("What are the key provisions in employment law?")}
                  >
                    <div className="text-sm font-medium mb-2">Employment Law</div>
                    <div className="text-xs text-muted-foreground">Ask about employment regulations and provisions</div>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInput("Explain contract termination procedures")}
                  >
                    <div className="text-sm font-medium mb-2">Contract Law</div>
                    <div className="text-xs text-muted-foreground">Learn about contract terms and procedures</div>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInput("How do I resolve legal disputes?")}
                  >
                    <div className="text-sm font-medium mb-2">Dispute Resolution</div>
                    <div className="text-xs text-muted-foreground">Learn about legal dispute procedures</div>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setInput("What makes a contract legally binding?")}
                  >
                    <div className="text-sm font-medium mb-2">Contract Validity</div>
                    <div className="text-xs text-muted-foreground">Understand contract requirements</div>
                  </Card>
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
                  demoMode
                    ? "Ask anything about legal documents..."
                    : apiError
                      ? "Connect to API to start chatting..."
                      : "Ask anything about your legal documents..."
                }
                disabled={loading || (!demoMode && !!apiError)}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || (!demoMode && !!apiError)}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {demoMode
                ? "Demo Mode - Press Enter to send"
                : apiError
                  ? "Connect to API to enable chat"
                  : "Press Enter to send, Shift+Enter for new line"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}