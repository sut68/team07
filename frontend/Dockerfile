FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# FIXED: รัน npm install แบบเต็ม เพื่อให้ Native Modules ถูกคอมไพล์อย่างถูกต้อง
RUN npm install

FROM node:20-slim AS builder
WORKDIR /app

# Copy node_modules จาก Stage 1
COPY --from=deps /app/node_modules ./node_modules
# Copy Source Code ทั้งหมด
COPY . .

# รับค่า Argument ตอน Build เพื่อฝังลงใน Code
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

COPY --from=builder /app/public ./public/
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Environment Variable สำหรับ Runtime
ENV NODE_ENV production
ENV PORT 5173

EXPOSE 5173
CMD ["npm", "start"]