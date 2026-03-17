# Giai đoạn 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy source và build ứng dụng
COPY . .

RUN if [ -f .env.prod ]; then cp .env.prod .env; fi && npm run build

# Giai đoạn 2: Serve
FROM nginx:stable-alpine

# Copy file cấu hình nginx đã tùy chỉnh
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy bản build từ giai đoạn trước
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
