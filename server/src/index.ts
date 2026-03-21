import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import stockRoutes from './routes/stock.routes';
import { errorMiddleware } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stocks', stockRoutes);

// Error handling (must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server started on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`✓ Accounts endpoints: http://localhost:${PORT}/api/accounts`);
  console.log(`✓ Transactions endpoints: http://localhost:${PORT}/api/transactions`);
  console.log(`✓ Categories endpoints: http://localhost:${PORT}/api/categories`);
  console.log(`✓ Stocks endpoints: http://localhost:${PORT}/api/stocks`);
});

export default app;
