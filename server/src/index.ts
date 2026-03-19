import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server started on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
});

export default app;
