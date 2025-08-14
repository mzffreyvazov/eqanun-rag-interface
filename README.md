# Azerbaijani Legal RAG Interface

A modern React/Next.js frontend for the Azerbaijani Legal RAG Pipeline API. This interface provides an intuitive chat-based experience for querying legal documents using AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Running RAG Pipeline API server (FastAPI)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API endpoint:**
   ```bash
   # Create or update .env.local
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 API Integration

### API Server Setup
Make sure your FastAPI server is running:
```bash
# In your API project directory
python main.py
```

The API should be accessible at `http://localhost:8000` with these endpoints:
- `GET /health` - System health check
- `POST /upload` - Upload PDF documents
- `POST /chat` - Chat with RAG system
- `DELETE /documents` - Clear all documents

### Testing API Connection
Use the included test script:
```bash
node scripts/test-api.js
```

## 📋 Features

### ✅ Document Management
- **PDF Upload**: Drag & drop or click to upload PDF documents
- **File Validation**: Ensures only PDF files are processed
- **Progress Tracking**: Real-time upload progress and status
- **Document Clearing**: Remove all documents with one click

### ✅ Chat Interface
- **Smart Conversations**: Context-aware chat with document-based responses
- **Session Management**: Maintains conversation history
- **Multiple Sessions**: Switch between different chat sessions
- **Demo Mode**: Test the interface without API connection

### ✅ System Monitoring
- **Health Checks**: Real-time API status monitoring
- **Auto-Retry**: Automatic reconnection attempts
- **Document Count**: Live count of indexed documents
- **Error Handling**: Clear error messages and troubleshooting

### ✅ User Experience
- **Dark Theme**: Modern dark interface with proper theming
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Visual feedback for all operations
- **Accessibility**: Keyboard navigation and screen reader support

## 🎯 Usage

### 1. Connect to API
- Start with "Demo Mode" to explore the interface
- Click "Connect to API" when your server is ready
- Green status indicator shows successful connection

### 2. Upload Documents
- Click "Upload PDFs" button
- Select one or more PDF files
- Wait for processing confirmation
- Document count updates automatically

### 3. Start Chatting
- Type questions about your uploaded documents
- AI provides responses based on document content
- Use suggested prompts or ask custom questions
- Each session maintains conversation context

### 4. Manage Documents
- View total document count in sidebar
- Use "Clear All" to remove all documents
- Upload additional documents anytime

## 🛠️ Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000  # API server URL
```

### API Requirements
The interface expects these API endpoints:

**Health Check:**
```javascript
GET /health
Response: {
  "status": "healthy",
  "documents_count": 150,
  "collection_exists": true,
  "components": { ... }
}
```

**Upload Documents:**
```javascript
POST /upload
Content-Type: multipart/form-data
Body: files (PDF files)
Response: {
  "message": "Successfully processed 2 files",
  "files_processed": ["doc1.pdf", "doc2.pdf"],
  "total_documents": 152
}
```

**Chat:**
```javascript
POST /chat
Content-Type: application/json
Body: {
  "message": "What are employment law provisions?",
  "session_id": "optional-uuid"
}
Response: {
  "response": "Based on the documents...",
  "session_id": "uuid-123"
}
```

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to API server"**
- Verify FastAPI server is running: `python main.py`
- Check API URL in `.env.local`
- Ensure CORS is configured in API server
- Try refreshing the page

**"No documents uploaded yet"**
- Upload PDF documents using the upload button
- Verify files are valid PDFs
- Check API server logs for processing errors

**Upload fails**
- Ensure files are PDF format only
- Check file size limits
- Verify API server has proper write permissions
- Check network connection

**Chat responses are generic**
- Upload relevant PDF documents first
- Wait for document processing to complete
- Ask specific questions about document content
- Check document count in sidebar

### Demo Mode
- Use "Demo Mode" to test interface functionality
- Simulates API responses without server connection
- Great for development and testing UI components
- Switch to "Connect to API" for live functionality

## 🔒 Security Notes

- This is a development configuration with permissive CORS
- For production, configure proper CORS origins in API server
- Ensure API server has proper authentication if needed
- Validate and sanitize all user inputs on backend

## 📦 Build & Deploy

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Production Build
```bash
npm run build
npm run start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 🤝 Contributing

1. Follow React/Next.js best practices
2. Maintain TypeScript types
3. Test with both demo mode and live API
4. Ensure responsive design works
5. Update documentation for new features

---

## 📚 Related Documentation

- [API Documentation](.docs/API_DOCUMENTATION.md) - Complete API reference
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework

For questions or issues, refer to the API documentation or check the browser console for detailed error messages.
