# Invixy - Invoice Management System

A comprehensive invoice management application with custom tax system support, built with Next.js, Prisma, and PostgreSQL.

## 🚀 Features

### ✅ Completed (Phase 1 & 2):
- **Authentication & Authorization**
  - User registration and login with NextAuth
  - JWT-based session management
  - Role-based access control
  - Protected routes and API endpoints

- **Multi-Business Management**
  - Create and manage multiple businesses
  - Role-based permissions (Owner, Accountant, Employee)
  - Business switching functionality
  - User invitation system
  - Business profile management with logo, currency, timezone

### 🔄 Planned Features:
- **Product Management** (Phase 3)
- **Customer Management** (Phase 4) 
- **Custom Tax Systems** (Phase 5)
- **Invoice Management** (Phase 6)
- **Reporting & Analytics** (Phase 7)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth with JWT strategy
- **Validation**: Zod schemas
- **UI Components**: Radix UI, Lucide React

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── business/       # Business management endpoints
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── business.ts        # Business helper functions
│   ├── db.ts              # Database connection
│   ├── permissions.ts     # Role-based access control
│   └── validations/       # Zod schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── types/                 # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd invixy-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/invixy"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

4. **Run database migrations**
```bash
npx prisma migrate dev
```

5. **Generate Prisma client**
```bash
npx prisma generate
```

6. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

### Current Models:
- **User** - User accounts with NextAuth integration
- **Business** - Company/business entities with enhanced fields
- **BusinessUserRole** - Role-based access control for users in businesses
- **Account, Session, VerificationToken** - NextAuth required models

### Role Hierarchy:
- **OWNER** - Full access to business management
- **ACCOUNTANT** - Financial operations and user management
- **EMPLOYEE** - Limited access to assigned tasks

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login (NextAuth)

### Business Management
- `GET /api/business` - List user's businesses
- `POST /api/business` - Create new business
- `PATCH /api/business/[id]` - Update business
- `DELETE /api/business/[id]` - Delete business (soft)
- `POST /api/business/switch` - Switch active business
- `GET /api/business/dashboard` - Dashboard data
- `GET /api/business/users` - List business users
- `POST /api/business/users` - Invite user to business

## 🧪 Development

### Database Commands
```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Code Quality
- TypeScript for type safety
- Zod for runtime validation
- Role-based permission system
- Error handling with proper HTTP status codes

## 📈 Development Phases

- ✅ **Phase 1**: Authentication & Authorization
- ✅ **Phase 2**: Business Management  
- 🔄 **Phase 3**: Product Management (Next)
- 📋 **Phase 4**: Customer Management
- 📋 **Phase 5**: Tax System Management
- 📋 **Phase 6**: Invoice Management
- 📋 **Phase 7**: Reporting & Analytics

## 📝 Contributing

1. Follow the established patterns for API routes
2. Use TypeScript and proper type definitions
3. Implement proper error handling
4. Add validation with Zod schemas
5. Follow the role-based permission system

## 📄 License

This project is private and proprietary.
