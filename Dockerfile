# Multi-stage Dockerfile for Chancen NestJS API

# Stage 1: Install dependencies
FROM node:22-slim AS deps
RUN apt-get update -qq && apt-get install --no-install-recommends -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the project
FROM node:22-slim AS builder
RUN apt-get update -qq && apt-get install --no-install-recommends -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Stage 3: Production runner
FROM node:22-slim AS runner
RUN apt-get update -qq && apt-get install --no-install-recommends -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 5000

CMD ["npm", "run", "start:prod"]
