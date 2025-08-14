#!/usr/bin/env node

const API_BASE_URL = "http://localhost:8000";

async function testAPI() {
  console.log("🔍 Testing RAG Pipeline API Connection...\n");

  // Test 1: Health Check
  try {
    console.log("1. Testing health endpoint...");
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }
    
    const healthData = await healthResponse.json();
    console.log("✅ Health check passed");
    console.log("   Status:", healthData.status);
    console.log("   Documents:", healthData.documents_count || healthData.total_documents || 0);
    console.log("   Collection exists:", healthData.collection_exists);
    
    if (healthData.components) {
      console.log("   Components:", Object.entries(healthData.components)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", "));
    }
  } catch (error) {
    console.log("❌ Health check failed");
    console.log("   Error:", error.message);
    console.log("\n💡 Make sure your FastAPI server is running:");
    console.log("   python main.py");
    return;
  }

  // Test 2: Status Check
  try {
    console.log("\n2. Testing status endpoint...");
    const statusResponse = await fetch(`${API_BASE_URL}/status`);
    
    if (!statusResponse.ok) {
      throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
    }
    
    const statusData = await statusResponse.json();
    console.log("✅ Status check passed");
    console.log("   Status:", statusData.status);
    console.log("   Message:", statusData.message);
  } catch (error) {
    console.log("❌ Status check failed");
    console.log("   Error:", error.message);
  }

  // Test 3: Chat Test (if documents exist)
  try {
    console.log("\n3. Testing chat endpoint...");
    const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello, can you help me with legal questions?",
      }),
    });
    
    if (!chatResponse.ok) {
      throw new Error(`HTTP ${chatResponse.status}: ${chatResponse.statusText}`);
    }
    
    const chatData = await chatResponse.json();
    console.log("✅ Chat test passed");
    console.log("   Session ID:", chatData.session_id);
    console.log("   Response preview:", chatData.response.substring(0, 100) + "...");
  } catch (error) {
    console.log("❌ Chat test failed");
    console.log("   Error:", error.message);
    console.log("   Note: This might be normal if no documents are uploaded yet");
  }

  console.log("\n🎉 API testing complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Upload PDF documents via the web interface");
  console.log("   2. Start asking questions about your documents");
  console.log("   3. Check the web app at http://localhost:3000");
}

// Run the test
testAPI().catch(console.error);
