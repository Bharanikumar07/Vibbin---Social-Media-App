# Vibebin - Technology Stack Documentation

> **A modern, real-time social networking platform**  
> Built with cutting-edge technologies for seamless user experience

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Technologies](#frontend-technologies)
3. [Backend Technologies](#backend-technologies)
4. [Database & ORM](#database--orm)
5. [Real-time Communication](#real-time-communication)
6. [Authentication & Security](#authentication--security)
7. [File Management](#file-management)
8. [Development Tools](#development-tools)
9. [Architecture](#architecture)
10. [Features Implementation](#features-implementation)

---

## 🎯 Overview

**Vibebin** is a full-stack social networking application that enables users to connect, share posts, send messages, and build meaningful relationships. The application is built with a modern tech stack emphasizing real-time capabilities, security, and user experience.

### Key Characteristics
- **Real-time** messaging and notifications
- **Responsive** design for all devices
- **Secure** authentication with JWT
- **Scalable** architecture
- **Type-safe** with TypeScript

---

## 🎨 Frontend Technologies

### Core Framework
- **React 18** - Modern UI library with hooks and concurrent features
  - Functional components with hooks
  - Context API for state management
  - Custom hooks for reusable logic

### Language
- **TypeScript** - Type-safe JavaScript
  - Interface definitions for API responses
  - Type checking for props and state
  - Enhanced IDE support and autocomplete

### Routing
- **React Router v6** - Declarative routing
  - Protected routes for authenticated users
  - Dynamic routing for user profiles
  - Programmatic navigation
  - Location-based conditional rendering

### Styling
- **Vanilla CSS** - Custom styling with CSS variables
  - CSS Variables for theming (light/dark mode)
  - Flexbox and Grid layouts
  - Responsive design with media queries
  - Custom animations with @keyframes
  - Smooth transitions and hover effects

### UI/UX Libraries
- **Lucide React** - Beautiful icon library
  - Consistent icon design
  - Tree-shakeable imports
  - Customizable size and color

### Date Utilities
- **date-fns** - Modern date utility library
  - `formatDistanceToNow()` for relative time
  - `format()` for date formatting
  - Lightweight and modular

### HTTP Client
- **Axios** - Promise-based HTTP client
  - Request/response interceptors
  - Automatic JSON transformation
  - Error handling
  - Custom instance with base URL

### Build Tool
- **Vite** - Next-generation frontend tooling
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized build with Rollup
  - Native ES modules support
  - Fast development server

---

## ⚙️ Backend Technologies

### Runtime
- **Node.js** - JavaScript runtime
  - Event-driven, non-blocking I/O
  - NPM ecosystem
  - Async/await support

### Framework
- **Express.js** - Web application framework
  - Middleware architecture
  - Routing system
  - RESTful API design
  - Error handling middleware

### Language
- **TypeScript** - Type-safe Node.js development
  - Interface-based API contracts
  - Type safety across server code
  - Better refactoring support

### Process Management
- **ts-node** - TypeScript execution for Node.js
  - Direct TypeScript execution
  - Development server with hot reload
  - No compilation step needed

---

## 💾 Database & ORM

### Database
- **PostgreSQL** - Powerful relational database
  - ACID compliance
  - Advanced indexing
  - Full-text search capabilities
  - JSON support

### ORM
- **Prisma** - Next-generation ORM
  - Type-safe database client
  - Auto-generated types from schema
  - Migration management
  - Intuitive query API
  - Relations and joins
  - Database introspection

### Schema Management
- **Prisma Migrate** - Database migration tool
  - Version-controlled schema changes
  - Automatic migration generation
  - Rollback support

---

## 🔄 Real-time Communication

### WebSocket Library
- **Socket.IO** - Real-time bidirectional communication
  - **Server**: `socket.io` (v4.8.3)
  - **Client**: `socket.io-client`

### Real-time Features Implemented
1. **Instant Messaging**
   - Message delivery notifications
   - Read receipts
   - Typing indicators
   
2. **Online Presence**
   - User online/offline status
   - Last seen timestamps
   - Status broadcast to all clients

3. **Live Notifications**
   - Friend request notifications
   - Post likes and comments
   - Real-time updates

### Socket Events
```typescript
// Client → Server
socket.emit('join', userId)
socket.emit('typing', { receiverId, isTyping })

// Server → Client
socket.on('newMessage', handleMessage)
socket.on('userStatus', handleStatusChange)
socket.on('userTyping', handleTyping)
socket.on('initialOnlineUsers', handleInitialStatus)
```

---

## 🔐 Authentication & Security

### Authentication Methods

#### 1. JWT (JSON Web Tokens)
- **jsonwebtoken** - Token generation and verification
  - Stateless authentication
  - Secure token signing
  - Expiration management
  - Token-based authorization

#### 2. Google OAuth 2.0
- **@react-oauth/google** - Google authentication
- **google-auth-library** - Server-side verification
  - One-tap sign-in
  - Automatic account creation
  - Profile picture import

### Password Security
- **bcryptjs** - Password hashing
  - Salt rounds: 10
  - Secure password comparison
  - One-way encryption

### Security Middleware
```typescript
authenticateToken(req, res, next) {
  // Verify JWT from Authorization header
  // Attach user to request object
}
```

### CORS Configuration
- **cors** - Cross-Origin Resource Sharing
  - Configurable origins
  - Methods: GET, POST, PUT, DELETE, PATCH
  - Authorization header support

---

## 📁 File Management

### File Upload
- **Multer** - Multipart form data handling
  - Image upload for posts
  - Profile picture upload
  - Story media upload
  - Local file storage

### Storage Structure
```
server/src/uploads/
  ├── profile-{timestamp}.jpg
  ├── post-{timestamp}.jpg
  └── story-{timestamp}.jpg
```

### File Serving
- Express static middleware
- Public access to `/uploads` directory
- Image optimization (client-side)

---

## 🛠️ Development Tools

### Package Managers
- **npm** - Node package manager
  - Dependency management
  - Script running
  - Version locking

### Development Utilities
- **nodemon** - Auto-restart on file changes
- **concurrently** - Run multiple commands
  - Simultaneous client and server dev servers

### Type Definitions
- `@types/bcryptjs`
- `@types/cors`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/multer`
- `@types/node`
- `@types/nodemailer`
- `@types/node-cron`

### Email Service
- **Nodemailer** - Email sending
  - Password reset emails
  - Welcome emails
  - Notification emails
  - SMTP configuration

### Scheduled Tasks
- **node-cron** - Cron job scheduler
  - Auto-delete posts/stories after 24 hours
  - Cleanup old data
  - Scheduled maintenance tasks

---

## 🏗️ Architecture

### Project Structure

```
vibebin/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS stylesheets
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Helper functions
│   │   ├── uploads/       # File storage
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
└── README.md
```

### Design Patterns

#### 1. **MVC Pattern** (Backend)
- **Models**: Prisma schema definitions
- **Views**: JSON API responses
- **Controllers**: Business logic handlers

#### 2. **Component-Based Architecture** (Frontend)
- Reusable UI components
- Container/Presentational pattern
- Composition over inheritance

#### 3. **Context + Hooks Pattern**
- `AuthContext` - User authentication state
- `ThemeContext` - Theme management
- `useSocket` - WebSocket connection
- `useOnlinePresence` - User presence tracking

---

## ✨ Features Implementation

### 1. User Authentication
**Technologies**: JWT, bcryptjs, Google OAuth  
**Flow**:
1. User signs up/logs in
2. Server generates JWT token
3. Token stored in localStorage
4. Token sent with each API request
5. Middleware verifies token

### 2. Real-time Messaging
**Technologies**: Socket.IO, React hooks  
**Implementation**:
- WebSocket connection on user login
- Message emit/receive through sockets
- Typing indicators with debouncing
- Online/offline status updates

### 3. Posts & Stories
**Technologies**: Multer, Prisma, node-cron  
**Features**:
- Image upload with Multer
- Database storage with Prisma
- Auto-deletion after 24 hours
- Like and comment system

### 4. Friend System
**Technologies**: Prisma relations, React state  
**Functionality**:
- Send friend requests
- Accept/reject requests
- Friend list management
- Request status tracking

### 5. Theme System
**Technologies**: CSS variables, Context API  
**Implementation**:
- Light/dark mode toggle
- Persistent theme storage
- Smooth transitions
- System preference detection

### 6. Online Presence
**Technologies**: Socket.IO, Prisma, React hooks  
**Features**:
- Real-time status updates
- Last seen timestamps
- Visual indicators (green glow)
- Automatic cleanup on server restart

---

## 📊 Database Schema

### Key Tables
- **User** - User accounts and profiles
- **Post** - User posts with images
- **Story** - Temporary stories (24h)
- **Comment** - Post comments
- **Like** - Post likes
- **FriendRequest** - Friend connections
- **Message** - Chat messages
- **Notification** - User notifications
- **PasswordResetToken** - Password recovery

### Relationships
```
User
  ├─→ Posts (one-to-many)
  ├─→ Stories (one-to-many)
  ├─→ Comments (one-to-many)
  ├─→ Likes (one-to-many)
  ├─→ SentMessages (one-to-many)
  ├─→ ReceivedMessages (one-to-many)
  └─→ Friends (many-to-many)
```

---

## 🚀 Deployment Considerations

### Environment Variables Required

#### Client (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

#### Server (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/vibebin
JWT_SECRET=your_secret_key
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Production Recommendations
1. **Frontend**: Vercel, Netlify, or AWS Amplify
2. **Backend**: Railway, Render, or AWS EC2
3. **Database**: Supabase, Neon, or AWS RDS
4. **File Storage**: AWS S3 or Cloudinary
5. **Email**: SendGrid or AWS SES

---

## 📈 Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Memoization with useMemo/useCallback
- Virtual scrolling for long lists
- Image lazy loading
- Debounced search inputs

### Backend
- Database indexing on frequently queried fields
- Connection pooling with Prisma
- Gzip compression
- Response caching for static data
- Efficient query design (avoiding N+1 queries)

---

## 🔧 NPM Scripts

### Client
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

### Server
```json
{
  "dev": "ts-node src/index.ts",
  "start": "node dist/index.js",
  "migrate": "npx prisma migrate dev",
  "generate": "npx prisma generate"
}
```

### Root
```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "cd server && npm run dev",
  "dev:client": "cd client && npm run dev"
}
```

---

## 📝 Version Information

| Technology | Version |
|-----------|---------|
| React | ^18.3.1 |
| TypeScript | ^5.6.2 |
| Vite | ^6.0.5 |
| Node.js | ^20.x |
| Express | ^5.2.1 |
| Socket.IO | ^4.8.3 |
| Prisma | ^6.2.1 |
| PostgreSQL | ^14.x |

---

## 👨‍💻 Developer Information

**Managed and designed by**: Bharanikumar G.V.  
**Contact**: bharanikumargv07@gmail.com  
**Year**: 2026

---

## 📄 License

All rights reserved. Registered trademark of Bharanikumar G.V.

---

## 🎓 Learning Resources

### Frontend
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### Backend
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Docs](https://socket.io/docs/)

### Full Stack
- [JWT.io](https://jwt.io/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Built with ❤️ using modern web technologies**
