# Quiz Application Backend

A professional, multi-tenant quiz application backend built with Node.js, TypeScript, and Prisma ORM.

## 🚀 Features

- **Multi-Tenant Architecture**: Support for multiple institutions with data isolation
- **Role-Based Access Control**: 5 distinct user roles with granular permissions
- **JWT Authentication**: Secure token-based authentication system
- **Quiz Management**: Create, schedule, and manage quizzes with AI generation support
- **Real-time Features**: Quiz attempts, scoring, and leaderboards
- **Comprehensive API**: RESTful API with proper validation and error handling
- **Security**: Rate limiting, CORS, helmet security, and input validation
- **Logging**: Structured logging with Winston
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations

## 🏗️ Architecture

```
src/
├── config/          # Database and configuration
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, and security
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── scripts/         # Database seeding and utilities
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/quiz_app_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | User registration | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/send-otp` | Send OTP for verification | No |
| POST | `/auth/verify-otp` | Verify OTP | No |
| PUT | `/auth/reset-password` | Reset password | No |
| GET | `/auth/profile` | Get user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| POST | `/auth/logout` | User logout | Yes |

### Institution Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/institutions` | Create institution | Yes | ADMIN, SUPER_ADMIN |
| GET | `/institutions` | List institutions | Yes | ADMIN, SUPER_ADMIN, GLOBAL_CONTENT_CREATOR |
| GET | `/institutions/:id` | Get institution | Yes | All (with access) |
| PUT | `/institutions/:id` | Update institution | Yes | ADMIN, SUPER_ADMIN |
| DELETE | `/institutions/:id` | Delete institution | Yes | SUPER_ADMIN |
| PUT | `/institutions/:id/approve` | Approve/reject institution | Yes | SUPER_ADMIN |

### Quiz Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/quizzes` | Create quiz | Yes | TEACHER, ADMIN, GLOBAL_CONTENT_CREATOR, SUPER_ADMIN |
| POST | `/quizzes/ai-generate` | Generate AI quiz | Yes | TEACHER, ADMIN, GLOBAL_CONTENT_CREATOR, SUPER_ADMIN |
| GET | `/quizzes` | List quizzes | Yes | All |
| GET | `/quizzes/upcoming` | Get upcoming quizzes | Yes | All |
| GET | `/quizzes/active` | Get active quizzes | Yes | All |
| GET | `/quizzes/completed` | Get completed quizzes | Yes | All |
| GET | `/quizzes/:id` | Get quiz details | Yes | All (with access) |
| PUT | `/quizzes/:id` | Update quiz | Yes | Creator, ADMIN, SUPER_ADMIN |
| DELETE | `/quizzes/:id` | Delete quiz | Yes | Creator, ADMIN, SUPER_ADMIN |

### Quiz Participation

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/quizzes/:id/attempt` | Start quiz attempt | Yes | STUDENT |
| PUT | `/quizzes/:id/submit` | Submit quiz answers | Yes | STUDENT |
| GET | `/quizzes/:id/results` | Get quiz results | Yes | All (with access) |

## 👥 User Roles

### SUPER_ADMIN
- Full system access
- Approve/reject institutions
- Manage all users and content
- Global system settings

### GLOBAL_CONTENT_CREATOR
- Create global content
- Manage multiple institutions
- Create reusable quizzes
- Global competitions

### ADMIN
- Manage institution
- Approve/reject teachers & students
- Institution settings
- View reports

### TEACHER
- Create and manage quizzes
- Schedule quizzes
- Generate AI questions
- View class reports

### STUDENT
- Take scheduled quizzes
- View results and analytics
- Track progress
- Participate in leaderboards

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application uses a multi-tenant database design with the following key models:

- **User**: Multi-role user management
- **Institution**: Multi-tenant institution support
- **Grade**: Educational grade levels
- **Subject**: Academic subjects
- **Quiz**: Quiz definitions and settings
- **Question**: Quiz questions with options
- **QuizAttempt**: Student quiz attempts and scores
- **Leaderboard**: Gamification and rankings

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Environment Configuration

Set production environment variables:

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
```

### 3. Start Production Server

```bash
npm start
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `REDIS_URL` | Redis connection string | Optional |
| `AI_SERVICE_URL` | AI service endpoint | Optional |
| `AI_SERVICE_KEY` | AI service API key | Optional |

## 🔧 Development Commands

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database

# Code quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request controllers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database scripts
│   └── index.ts          # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── logs/                 # Application logs
├── uploads/              # File uploads
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the API documentation at `/api/v1/docs`
2. Review the logs in the `logs/` directory
3. Check the database connection and schema
4. Verify environment variables are set correctly

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Mobile app support
- [ ] Integration with external LMS systems
- [ ] Advanced AI question generation
- [ ] Multi-language support
- [ ] Advanced gamification features
