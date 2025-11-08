# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY . .

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma generated files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application files
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/app.js ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]