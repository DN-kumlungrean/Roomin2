# ใช้ Node 24 บน Alpine (ขนาดเล็ก)
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# รัน Vite ให้เข้าถึงได้จากเครื่องภายนอก
CMD ["npm", "run", "dev", "--", "--host"]


# FROM node:24-alpine AS build

# WORKDIR /app
# COPY package*.json ./
# RUN npm install

# # คัดลอกซอร์สโค้ดและทำการ build
# COPY . .
# # 💡 คำสั่ง build จริงๆ (นี่คือสิ่งที่ต่างจาก dev)
# RUN npm run build 

# # Stage 2: Serve Phase (ใช้ Nginx เพื่อ Serve Static Files)
# # ใช้ Nginx alpine Image ซึ่งมีขนาดเล็กมาก
# FROM nginx:alpine

# # 💡 สำคัญ: คัดลอกไฟล์ที่ Build สำเร็จแล้ว (เช่น โฟลเดอร์ dist หรือ build)
# # ตรวจสอบชื่อโฟลเดอร์ build output ของ Vite (ปกติคือ dist)
# COPY --from=build /app/dist /usr/share/nginx/html 

# # 💡 ถ้าคุณมีไฟล์ตั้งค่า Nginx (เช่น เพื่อทำ Reverse Proxy หรือตั้งค่า SPA Fallback)
# # COPY nginx.conf /etc/nginx/conf.d/default.conf 

# # เปิดพอร์ตมาตรฐานสำหรับ HTTP
# EXPOSE 80

# # สั่งให้ Nginx รันใน foreground
# CMD ["nginx", "-g", "daemon off;"]