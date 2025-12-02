# 🤖 Chat API Guide

## 📋 Mô Tả

API Chat với AI sử dụng Google Gemini AI, hỗ trợ streaming real-time qua Socket.IO.

## 🚀 Cài Đặt Dependencies

Dependencies đã được cài đặt trong `package.json`:

```json
{
  "@google/generative-ai": "^0.24.1",
  "socket.io": "^4.8.1"
}
```

## 📡 API Endpoints (Base URL: `/v1/chat`)

### 1. Tạo Session Mới
**POST** `/sessions`

```bash
curl -X POST http://localhost:8020/v1/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Tư vấn sản phẩm xanh"
  }'
```

### 2. Lấy Danh Sách Sessions
**GET** `/sessions`

```bash
curl -X GET http://localhost:8020/v1/chat/sessions?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Chi Tiết Session
**GET** `/sessions/:sessionId`

```bash
curl -X GET http://localhost:8020/v1/chat/sessions/674c8e5f123456789abcdef0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Cập Nhật Tiêu Đề Session
**PUT** `/sessions/:sessionId`

```bash
curl -X PUT http://localhost:8020/v1/chat/sessions/674c8e5f123456789abcdef0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Tiêu đề mới"
  }'
```

### 5. Xóa Session
**DELETE** `/sessions/:sessionId`

```bash
curl -X DELETE http://localhost:8020/v1/chat/sessions/674c8e5f123456789abcdef0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Lịch Sử Chat
**GET** `/sessions/:sessionId/messages`

```bash
curl -X GET http://localhost:8020/v1/chat/sessions/674c8e5f123456789abcdef0/messages?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Gửi Message (với streaming)
**POST** `/messages`

```bash
curl -X POST http://localhost:8020/v1/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionId": "674c8e5f123456789abcdef0",
    "content": "Tư vấn cho tôi về sản phẩm thân thiện môi trường"
  }'
```

### 8. Auto-generate Tiêu Đề
**POST** `/sessions/:sessionId/generate-title`

```bash
curl -X POST http://localhost:8020/v1/chat/sessions/674c8e5f123456789abcdef0/generate-title \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔌 Socket.IO Events (namespace: `/chat`)

### Client kết nối

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:8020/chat', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
})

// Join session để nhận stream
socket.emit('join_session', sessionId)

// Nhận streaming response
socket.on('stream', (data) => {
  console.log('Received chunk:', data.chunk)
  // Append chunk to UI
})

// Nhận khi hoàn tất
socket.on('stream_end', (data) => {
  console.log('Complete message:', data.message)
})

// Nhận lỗi
socket.on('error', (data) => {
  console.error('Error:', data.error)
})

// Leave session
socket.emit('leave_session', sessionId)
```

### React Example

```jsx
import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

const ChatComponent = ({ sessionId, authToken }) => {
  const [socket, setSocket] = useState(null)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    const newSocket = io('http://localhost:8020/chat', {
      auth: { token: authToken }
    })

    newSocket.emit('join_session', sessionId)

    newSocket.on('stream', (data) => {
      setStreamingMessage(prev => prev + data.chunk)
      setIsStreaming(true)
    })

    newSocket.on('stream_end', (data) => {
      setIsStreaming(false)
      // Save complete message to state
    })

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.error)
      setIsStreaming(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave_session', sessionId)
      newSocket.disconnect()
    }
  }, [sessionId, authToken])

  const sendMessage = async (content) => {
    setStreamingMessage('')
    setIsStreaming(true)

    try {
      await fetch('http://localhost:8020/v1/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sessionId,
          content
        })
      })
    } catch (error) {
      console.error('Send message error:', error)
      setIsStreaming(false)
    }
  }

  return (
    <div>
      {/* Chat UI here */}
      {isStreaming && (
        <div className="streaming-message">
          {streamingMessage}
        </div>
      )}
    </div>
  )
}
```

## 📝 Response Format

### Success Response
```json
{
  "code": 200,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "code": 400,
  "message": "Error message"
}
```

## 🔒 Authentication

Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🌐 Server Configuration

Server sẽ chạy trên:
- **Development**: `http://localhost:8020`
- **Production**: Theo `process.env.PORT`

## 💡 Tips Sử Dụng

1. **Streaming**: Luôn join session trước khi gửi message
2. **Title Generation**: Chỉ generate title khi có ít nhất 1 message
3. **Error Handling**: Listen socket errors để xử lý lỗi real-time
4. **Session Management**: Session thuộc về user, không thể truy cập session của user khác

## 🧪 Test với Postman

1. Import collection với các endpoint trên
2. Set environment variable `token` với JWT token
3. Set environment variable `sessionId` sau khi tạo session
4. Test streaming bằng cách mở Socket.IO client

## 🐛 Debugging

Enable debug logs:
```bash
DEBUG=socket.io:* npm start
```