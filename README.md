 ServiceHub Ethiopia

A full-stack service marketplace platform where users can buy and sell services, connect via real-time chat, and manage their business.

  Live Demo

-Frontend: https://servicehub-psi.vercel.app

-Backend API: https://servicehub-backend-d12v.onrender.com

  Features

* Authentication & Profile
- JWT-based secure authentication
- User registration (Buyer/Seller/Both roles)
- Profile management with avatar and cover photo
- Password reset via email
- Follow/Unfollow system

# Posts & Social Features
- Create, edit, delete service posts
- Like, comment, and repost functionality
- Save posts to read later
- Report inappropriate content
- Trending posts and topics feed

# Real-time Chat
- Instant messaging with Socket.io
- Send images, files, and voice messages
- Message read receipts
- Edit and delete messages
- Link previews in chat

# Notifications
- Real-time notifications for likes, comments, reposts, follows
- Profile view notifications
- Mark as read functionality

# User Experience
- Dark/Light mode toggle with system preference
- Fully responsive design (mobile, tablet, desktop)
- Smooth animations and transitions

# Search & Discovery
- Search services by title, description, category
- Filter by price range and category
- Sort by relevance, newest, price
- Autocomplete suggestions as you type

# Dashboard
- Seller dashboard with service management
- Order management (accept, complete, cancel)
- Sales overview and analytics

# Tech Stack

# Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- Socket.io-client
- React Router DOM
- React Hot Toast

# Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- JWT for authentication
- Bcryptjs for password hashing
- Multer for file uploads
- Cloudinary for image storage
- Nodemailer for email service

# Installation

# Prerequisites
- Node.js (v14 or higher)
- MongoDB (Atlas or local)
- Cloudinary account
- Gmail account (for email notifications)

   1. Clone the Repository
```bash
git clone https://github.com/helenlemessa/servicehub.git
cd servicehub
