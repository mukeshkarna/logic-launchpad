# BlogHub - Medium-like Blogging Platform

A full-featured, production-ready blogging platform built with modern web technologies. This platform provides a rich writing experience similar to Medium.com, complete with analytics, comments, likes, and multi-user support.

## 🚀 Features

### Core Features
- **Rich Text Editor**: Tip Tap-based editor with Medium-style inline formatting
- **Block-level Controls**:
  - Text formatting (headings, bold, italic, underline, strikethrough)
  - Code blocks with syntax highlighting
  - Image upload and embedding
  - Tables, lists, and blockquotes
  - Text alignment
- **Draft & Publish**: Save drafts and publish when ready
- **Blog Analytics**: Track views, likes, and comments
- **Multi-user Support**: Complete user authentication and registration
- **Public Reading**: No login required to read published blogs
- **User Profiles**: Author profiles with blog listings
- **Comment System**: Threaded comments with reply support
- **Social Features**: Like/unlike blogs, follow users

### Technical Features
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first, works on all devices
- **SEO-Friendly**: Blog slugs and meta tags
- **Secure**: JWT authentication, input validation, XSS protection
- **Containerized**: Complete Docker setup
- **Production Ready**: Environment-based configuration

### Super Admin Features ⭐
- **Comprehensive Dashboard**: Real-time platform statistics and trend analytics
- **User Management**: Full CRUD operations, role management, suspend/ban/reinstate users
- **Content Moderation**: Review, edit, feature, and manage all blog posts
- **Leaderboards**: Track top bloggers, top blogs, and rising stars
- **Reports & Moderation**: Handle user reports with workflow management
- **Platform Settings**: Configure site-wide settings and parameters
- **Audit Logs**: Complete action history for accountability
- **Bulk Operations**: Manage multiple blogs at once
- **Advanced Analytics**: User registration, publication, and engagement trends
- **Badge System**: Achievements for user milestones

👉 **[View Complete Admin Features Documentation](./ADMIN_FEATURES.md)**

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Tip Tap (ProseMirror)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Notifications**: React Hot Toast

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js (Local & Google OAuth)
- **Validation**: express-validator
- **File Upload**: Multer

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **Docker**: Latest version
- **Docker Compose**: Latest version

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd logic-launchpad
```

### 2. Environment Setup

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL=postgresql://bloguser:blogpassword@postgres:5432/blogdb
POSTGRES_USER=bloguser
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=blogdb

# Backend
BACKEND_PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

### 3. Run with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

### 4. Initialize Database

```bash
# Enter backend container
docker-compose exec backend sh

# Run Prisma migrations
npx prisma migrate dev

# Seed database (creates super admin and default settings)
npm run prisma:seed

# Exit container
exit
```

**Super Admin Credentials (created by seed):**
- Email: `admin@bloghub.com`
- Username: `superadmin`
- Password: `admin123456`

⚠️ **Important**: Change the super admin password immediately after first login!

**Access Admin Panel**: Navigate to `/admin` after logging in with super admin credentials.

## 💻 Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update DATABASE_URL in .env to point to your local PostgreSQL

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## 🗄 Database Schema

### Key Models

- **User**: User accounts with authentication
- **Blog**: Blog posts with draft/published status
- **Comment**: Comments with threading support
- **Like**: Blog likes
- **View**: View tracking for analytics
- **Tag**: Blog categorization
- **Follow**: User follow system

### Relationships

- Users can have many Blogs, Comments, Likes
- Blogs belong to Users (authors)
- Comments can have parent Comments (threading)
- Blogs can have many Tags (many-to-many)

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/auth/me            - Get current user
POST   /api/auth/logout        - Logout user
GET    /api/auth/google        - Google OAuth
GET    /api/auth/google/callback - Google OAuth callback
```

### Blog Endpoints

```
GET    /api/blogs              - Get all published blogs (with pagination)
GET    /api/blogs/slug/:slug   - Get single blog by slug
GET    /api/blogs/my/all       - Get current user's blogs
GET    /api/blogs/user/:username - Get user's published blogs
POST   /api/blogs              - Create new blog
PUT    /api/blogs/:id          - Update blog
DELETE /api/blogs/:id          - Delete blog
POST   /api/blogs/:id/publish  - Publish blog
POST   /api/blogs/:id/unpublish - Unpublish blog
```

### Comment Endpoints

```
GET    /api/comments/blog/:blogId - Get blog comments
POST   /api/comments              - Create comment
PUT    /api/comments/:id          - Update comment
DELETE /api/comments/:id          - Delete comment
```

### Like Endpoints

```
POST   /api/likes/blog/:blogId - Toggle like on blog
GET    /api/likes/blog/:blogId - Get blog likes
```

### User Endpoints

```
GET    /api/users/:username          - Get user profile
PUT    /api/users/profile            - Update profile
POST   /api/users/:userId/follow     - Follow user
DELETE /api/users/:userId/follow     - Unfollow user
GET    /api/users/:userId/followers  - Get followers
GET    /api/users/:userId/following  - Get following
```

### Analytics Endpoints

```
GET    /api/analytics/blog/:blogId - Get blog analytics
GET    /api/analytics/user         - Get user analytics
```

### Upload Endpoints

```
POST   /api/upload/image - Upload image
```

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── register/          # Register page
│   │   ├── write/             # Blog editor
│   │   ├── blog/[slug]/       # Blog reading page
│   │   ├── dashboard/         # User dashboard
│   │   └── @[username]/       # User profile
│   ├── components/            # React components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── BlogCard.tsx       # Blog preview card
│   │   ├── TiptapEditor.tsx   # Rich text editor
│   │   └── AuthProvider.tsx   # Auth context
│   ├── lib/                   # Utilities
│   │   └── api.ts             # API client
│   └── store/                 # State management
│       └── authStore.ts       # Auth state
└── public/                    # Static assets
```

## 🔧 Backend Structure

```
backend/
├── src/
│   ├── server.ts              # Express app setup
│   ├── config/                # Configuration
│   │   └── passport.ts        # Passport strategies
│   ├── middleware/            # Custom middleware
│   │   └── auth.middleware.ts # JWT authentication
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── blog.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── like.routes.ts
│   │   ├── user.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── tag.routes.ts
│   └── controllers/           # Route controllers
│       ├── auth.controller.ts
│       ├── blog.controller.ts
│       ├── comment.controller.ts
│       ├── like.controller.ts
│       ├── user.controller.ts
│       ├── upload.controller.ts
│       ├── analytics.controller.ts
│       └── tag.controller.ts
├── prisma/
│   └── schema.prisma          # Database schema
└── uploads/                   # Uploaded files
```

## 🚀 Deployment

### Production Build

#### Using Docker Compose (Recommended)

```bash
# Set NODE_ENV to production in .env
NODE_ENV=production

# Build and start production containers
docker-compose up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

#### Manual Deployment

**Backend:**

```bash
cd backend
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm start
```

### Domain Deployment

1. **Update Environment Variables**:
   - Change `NEXT_PUBLIC_API_URL` to your backend domain
   - Change `NEXTAUTH_URL` to your frontend domain
   - Update `GOOGLE_CALLBACK_URL` with production URL

2. **SSL/HTTPS**:
   - Use a reverse proxy (Nginx/Caddy) for SSL termination
   - Update CORS settings in backend to allow your domain

3. **Database**:
   - Use a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)
   - Update `DATABASE_URL` in .env

4. **File Storage**:
   - For production, consider using S3/CloudFlare R2 for image storage
   - Update upload controller accordingly

### Nginx Configuration Example

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Considerations

- **Passwords**: Hashed with bcrypt (10 rounds)
- **JWT**: Secure secret keys, 7-day expiration
- **Input Validation**: express-validator on all inputs
- **XSS Protection**: Sanitized HTML content
- **SQL Injection**: Protected via Prisma ORM
- **CORS**: Configured for specific origins
- **File Upload**: Size limits and type validation
- **HTTPS**: Required in production

## 📝 Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `SESSION_SECRET`: Secret for session signing
- `NEXT_PUBLIC_API_URL`: Backend API URL

### Optional Variables

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Google OAuth callback URL
- `MAX_FILE_SIZE`: Max upload size (default: 5MB)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Or kill process using the port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:5000 | xargs kill -9  # Backend
```

### Image Upload Issues

```bash
# Check uploads directory permissions
chmod -R 755 backend/uploads
```

## 📄 License

MIT

## 👤 Author

Built for senior software developers who want a self-hosted blogging platform with full control.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Happy Blogging! 🎉**
