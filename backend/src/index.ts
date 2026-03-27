import app from './app';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Подключение к БД при старте
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});