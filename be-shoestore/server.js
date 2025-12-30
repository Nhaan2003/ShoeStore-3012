require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io for real-time chat
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

// Socket.io middleware
app.set('io', io);

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  socket.on('join_chat', (sessionId) => {
    socket.join(`chat_${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    console.log(`📊 Connected to database: ${process.env.DB_NAME}`);
    
    // Sync database - chỉ tạo table nếu chưa tồn tại
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Đổi thành false để không alter table
      console.log('✅ Database synchronized');
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    console.error('Please check your database configuration and ensure SQL Server is running.');
    process.exit(1);
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});