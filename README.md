# 🔧 Trello Clone - Backend API

## 📖 Mô tả dự án (What & Why)

**Trello Clone Backend** là RESTful API server cung cấp các services cho ứng dụng quản lý công việc theo mô hình Kanban board. Dự án này được xây dựng nhằm mục đích:

- **What**: Một backend API hoàn chỉnh với authentication, authorization, real-time communication, file upload, và email services
- **Why**: Thực hành phát triển backend với Node.js/Express, áp dụng clean architecture, security best practices, và các design patterns hiện đại

## 🔗 Liên kết dự án

- 🖥️ **Frontend Repository**: [Trello-Frontend](https://github.com/trander-25/Trello-Frontend)

## ✨ Tính năng chính

- 🔐 **Authentication & Authorization**: JWT-based với access/refresh token
- 📧 **Email Services**: Account verification, invitations với MailerSend
- 👥 **User Management**: Registration, profile management, avatar upload
- 📊 **Board Management**: CRUD operations với role-based permissions
- 📝 **Cards & Columns**: Quản lý tasks với drag & drop support
- 🖼️ **File Upload**: Cloud storage với Cloudinary integration
- 🔔 **Real-time Notifications**: Socket.io cho instant updates
- 👨‍👩‍👧‍👦 **Team Collaboration**: Invitation system, member management
- 🛡️ **Security**: Input validation, CORS, rate limiting, data sanitization
- 📊 **Pagination**: Efficient data loading với MongoDB aggregation

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Backend Core
- 🟢 **Node.js 18+** - JavaScript runtime
- 🚀 **Express.js** - Web framework
- 🍃 **MongoDB** - NoSQL database
- 🔄 **Babel** - ES6+ transpilation
- 📦 **ES6 Modules** - Modern import/export syntax

### Authentication & Security
- 🔐 **JWT (jsonwebtoken)** - Token-based authentication
- 🔒 **bcryptjs** - Password hashing
- 🛡️ **CORS** - Cross-origin resource sharing
- 🍪 **HTTP-only Cookies** - Secure token storage
- ✅ **Joi** - Input validation

### Cloud Services
- ☁️ **Cloudinary** - Image/file storage
- 📧 **MailerSend** - Email delivery service
- 🌐 **MongoDB Atlas** - Cloud database

### Real-time & File Handling
- ⚡ **Socket.io** - Real-time communication
- 📁 **Multer** - File upload middleware
- 🌊 **Streamifier** - Stream processing

### Development Tools
- 📝 **ESLint** - Code quality & style
- 🔄 **Nodemon** - Auto-restart development server
- 🎯 **HTTP Status Codes** - Standardized responses

## 🚀 Hướng dẫn cài đặt & chạy

### Yêu cầu hệ thống
- Node.js >= 18.x
- MongoDB database
- npm hoặc yarn
- Git

### Cài đặt

1. **Clone repository**
   ```bash
   git clone https://github.com/trander-25/Trello-Backend.git
   cd Trello-Backend
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. **Cấu hình environment variables**
   ```bash
   # Tạo file .env và cấu hình các biến môi trường
   cp .env.example .env
   ```

   **Cấu hình .env:**
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   DATABASE_NAME=trello_db
   
   # Server
   LOCAL_DEV_APP_HOST=localhost
   LOCAL_DEV_APP_PORT=8017
   BUILD_MODE=dev
   AUTHOR=Trander
   
   # Frontend URLs
   WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:5173
   WEBSITE_DOMAIN_PRODUCTION=https://your-domain.com
   
   # MailerSend
   MAILERSEND_API_KEY=your_mailersend_api_key
   ADMIN_SENDER_EMAIL=noreply@yourdomain.com
   ADMIN_SENDER_NAME=Trello Clone
   
   # JWT Secrets
   ACCESS_TOKEN_SECRET_SIGNATURE=your_access_token_secret
   ACCESS_TOKEN_LIFE=1h
   REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_token_secret
   REFRESH_TOKEN_LIFE=14 days
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Chạy ứng dụng**
   ```bash
   # Development mode (auto-reload)
   npm start
   # hoặc
   yarn start
   
   # Production mode
   npm run production
   # hoặc
   yarn production
   ```

### Scripts có sẵn
- `npm start` - Chạy development server với nodemon
- `npm run production` - Build và chạy production server
- `npm run build` - Build ứng dụng cho production
- `npm run lint` - Kiểm tra code quality với ESLint

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:8017`
- **Production**: `https://your-api-domain.com`

### API Endpoints

#### 🔐 Authentication
```
POST   /v1/users/register     # Đăng ký tài khoản
POST   /v1/users/verify       # Xác minh email
POST   /v1/users/login        # Đăng nhập
POST   /v1/users/logout       # Đăng xuất
POST   /v1/users/refresh      # Refresh access token
PATCH  /v1/users/update       # Cập nhật profile
```

#### 📊 Boards
```
POST   /v1/boards             # Tạo board mới
GET    /v1/boards/:id         # Lấy chi tiết board
PUT    /v1/boards/:id         # Cập nhật board
GET    /v1/boards             # Lấy danh sách boards (có pagination)
PUT    /v1/boards/supports/moving_card  # Di chuyển card giữa columns
```

#### 📝 Columns
```
POST   /v1/columns            # Tạo column mới
PUT    /v1/columns/:id        # Cập nhật column
DELETE /v1/columns/:id        # Xóa column
```

#### 🎯 Cards
```
POST   /v1/cards              # Tạo card mới
PUT    /v1/cards/:id          # Cập nhật card
DELETE /v1/cards/:id          # Xóa card
```

#### 👥 Invitations
```
POST   /v1/invitations/board  # Mời người dùng vào board
GET    /v1/invitations        # Lấy danh sách lời mời
PUT    /v1/invitations/:id    # Xử lý lời mời (accept/reject)
```

### Response Format
```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Format
```json
{
  "status": "error",
  "message": "Error description",
  "statusCode": 400
}
```

## 🏗️ Kiến trúc dự án

```
src/
├── config/          # Cấu hình database, CORS, environment
├── controllers/     # Request handlers
├── middlewares/     # Authentication, validation, error handling
├── models/          # Database models & schemas
├── providers/       # External services (JWT, Email, Cloud storage)
├── routes/          # API route definitions
├── services/        # Business logic layer
├── sockets/         # Real-time socket handlers
├── utils/           # Utility functions & helpers
├── validations/     # Request validation schemas
└── server.js        # Application entry point
```

## 📊 Trạng thái dự án

🚧 **Đang phát triển** - API hiện tại đã hoàn thành các tính năng cốt lõi và sẵn sàng cho production

### Hoàn thành ✅
- User authentication & authorization
- Board/Column/Card CRUD operations
- Real-time updates với Socket.io
- File upload & cloud storage
- Email services & notifications
- Input validation & security
- Error handling & logging

### Đang phát triển 🔄
- Advanced search & filtering
- Audit logs & activity tracking
- Rate limiting & API throttling
- Advanced file management

### Kế hoạch 📋
- API versioning strategy
- Microservices architecture
- Advanced caching with Redis
- Automated testing suite
- API documentation với Swagger

## 🛡️ Security Features

- 🔐 **JWT Authentication** với access/refresh token rotation
- 🍪 **HTTP-only Cookies** để bảo vệ tokens
- 🛡️ **Input Validation** với Joi schemas
- 🚫 **CORS Protection** với whitelist domains
- 🔒 **Password Hashing** với bcrypt
- 📧 **Email Verification** bắt buộc
- 🎯 **Role-based Authorization**
- 🧹 **Data Sanitization** tự động

## 👨‍💻 Tác giả & Liên hệ

**Trander**
- GitHub: [@trander-25](https://github.com/trander-25)
- Email: [thevinh15925@gmail.com](mailto:thevinh15925@gmail.com)

---

📄 **License**: MIT License  
⭐ Nếu dự án hữu ích, hãy cho một star nhé!
