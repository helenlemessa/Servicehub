const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const voicesDir = path.join(__dirname, 'uploads/voices');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(voicesDir)) {
  fs.mkdirSync(voicesDir, { recursive: true });
}

// Serve static files from uploads directory - ADD THIS LINE
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure CORS properly
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add this line in your server.js (after app.use(cors...) and before your routes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: [
    'http://localhost:5173',
    'https://servicehub-psi.vercel.app/'// Add your Netlify URL if using
  ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
// Add after other route declarations
app.use('/api/search', require('./routes/search'));
// Socket.io setup
const setupSocket = require('./socket/socketManager');
setupSocket(io);

// Database connection with better error handling
console.log('🔄 Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('Please check:');
  console.log('1. Your internet connection');
  console.log('2. MongoDB Atlas IP whitelist');
  console.log('3. MongoDB credentials');
  console.log('4. Or use local MongoDB: mongodb://localhost:27017/service-marketplace');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
});