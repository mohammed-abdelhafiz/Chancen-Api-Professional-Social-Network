# Chancen — Backend API & Real-Time Gateway (NestJS 11)

[![NestJS 11](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

Production-grade NestJS REST API and WebSocket Gateway powering the **Chancen** professional social platform.

---

## 🏗 Architecture & Engineering Highlights

- **Dual-Token JWT Authentication**: 15m access token + 7d revolving refresh token in httpOnly cookies.
- **WebSocket Gateway**: Real-time 1-on-1 and group chat rooms with typing indicators and notification delivery.
- **Enterprise Security**: Helmet, CORS protection, rate limiting (`@nestjs/throttler`), and class-validator DTOs.
- **Cloudinary Storage**: Secure media upload pipeline for avatars, covers, post photos, and PDF resumes.
- **Health Check Monitoring**: Dedicated `/api/health` endpoint for production probes.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev

# 3. Seed database
npx tsx prisma/seed.ts

# 4. Start development server
npm run start:dev
```
