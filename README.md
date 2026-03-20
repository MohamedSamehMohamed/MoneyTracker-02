# MoneyTracker 💰

A modern, full-stack money tracking application built with TypeScript, React, Express, and PostgreSQL.

## 📋 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Database Integration**: PostgreSQL with Prisma ORM for reliable data persistence
- **Responsive UI**: Built with React and Tailwind CSS
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **RESTful API**: Express.js backend with structured routing and middleware

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript 5.x
- Tailwind CSS v4
- Vite (build tool)

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication

**Development:**
- Docker & Docker Compose
- Git for version control

## 📁 Project Structure

```
MoneyTracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API integration
│   │   ├── contexts/      # React Context
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript types
│   │   └── index.ts
│   ├── prisma/            # Database schema
│   └── package.json
├── docker-compose.yml     # Docker setup
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL (or Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohamedSamehMohamed/MoneyTracker-02.git
   cd MoneyTracker-02
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd client
   npm install
   cd ..

   # Backend
   cd server
   npm install
   cd ..
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cd server
   cp .env.example .env
   # Update .env with your database credentials
   ```

4. **Setup database with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Run Prisma migrations**
   ```bash
   cd server
   npm run prisma:migrate
   npm run prisma:seed  # Optional: seed sample data
   ```

### Running the Application

**Backend (Terminal 1):**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

**Frontend (Terminal 2):**
```bash
cd client
npm run dev
```
Frontend runs on `http://localhost:5173`

## 📝 Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run tests

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed sample data

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are issued on successful login
- Tokens are stored in httpOnly cookies
- Protected routes require valid tokens
- Tokens expire after configured duration

## 📚 API Documentation

### Authentication Endpoints

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Logout:**
```bash
POST /api/auth/logout
Authorization: Bearer <token>
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📖 Development Guidelines

- Follow TypeScript strict mode
- Write meaningful commit messages
- Ensure code is linted before committing
- Add tests for new features
- Update documentation as needed

## 🐛 Troubleshooting

**Database connection issues:**
- Ensure PostgreSQL is running
- Check `.env` file for correct DATABASE_URL
- Run `docker-compose ps` to verify containers

**Port conflicts:**
- Frontend: Change port in `client/vite.config.ts`
- Backend: Change port in `server/.env`

**Dependencies issues:**
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Mohamed Sameh Mohamed**
- GitHub: [@MohamedSamehMohamed](https://github.com/MohamedSamehMohamed)

---

**Happy tracking! 🎯**
