# Shoe Store Backend API

A comprehensive e-commerce backend API for a shoe store built with Node.js, Express, and SQL Server.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin, Staff, Customer)
- 🛍️ **Product Management**: Full CRUD operations for products with variants (size, color)
- 🛒 **Shopping Cart**: Session-based cart management with real-time stock validation
- 📦 **Order Management**: Complete order lifecycle from creation to delivery
- 💬 **AI Chatbot**: Natural language processing for product recommendations and customer support
- 📊 **Admin Dashboard**: Sales analytics, inventory management, and reporting
- 📧 **Email Notifications**: Order confirmations, status updates, and password resets
- 🖼️ **Image Upload**: Optimized image processing with multiple sizes
- 🔍 **Advanced Search**: Filter products by multiple criteria with pagination
- 📈 **Real-time Updates**: Socket.io integration for live chat and notifications

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQL Server with Sequelize ORM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **File Upload**: Multer + Sharp
- **Email**: Nodemailer
- **Caching**: Redis
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Prerequisites

- Node.js >= 14.x
- SQL Server 2019+
- Redis Server
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shoe-store-backend.git
cd shoe-store-backend