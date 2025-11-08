FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
COPY .env .env

EXPOSE 3000
CMD ["npm", "run", "dev"]

# FROM node:20-alpine AS builder

# WORKDIR /app
# COPY package*.json ./

# # ติดตั้ง dependencies ทั้งหมด (รวมถึง Prisma CLI)
# RUN npm install 

# # คัดลอกซอร์สโค้ด และสั่ง Build (ถ้ามี)
# COPY . .
# # 💡 สำคัญ: สั่ง Prisma Generate เพื่อสร้าง Prisma Client
# RUN npx prisma generate

# # Stage 2: Production - Image สุดท้ายสำหรับการรันจริง
# FROM node:20-slim

# WORKDIR /app

# # 💡 แก้ไข Path COPY ใน Stage 2 ให้ตรงกับโครงสร้างใน Stage 1
# COPY --from=builder /app/node_modules ./node_modules

# # โค้ด Backend อยู่ในโฟลเดอร์ 'backend'
# COPY --from=builder /app/backend/controllers ./controllers 
# COPY --from=builder /app/backend/config ./config 
# COPY --from=builder /app/backend/routers ./routers
# COPY --from=builder /app/app.js .

# # ไฟล์สำคัญอื่นๆ
# COPY --from=builder /app/package.json .
# COPY --from=builder /app/prisma ./prisma 

# # พอร์ตที่ Server API ของคุณจะฟังอยู่ (เช่น Express/NestJS)
# EXPOSE 3000

# # คำสั่งเริ่มต้นรัน Production Server
# CMD ["npm", "start"]