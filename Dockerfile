# Frontend: React (Vite) build + nginx serving on port 80
# Reverse-proxies /api/ to backend over internal Docker network.
FROM node:20-slim AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build production bundle
COPY index.html vite.config.ts tsconfig.json tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public
COPY server ./server
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-bookworm AS runtime

# Network debug tools (required)
RUN apt-get update && apt-get install -y wget curl net-tools iputils-ping dnsutils netcat-openbsd && rm -rf /var/lib/apt/lists/*

# SPA build output
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx vhost with /api reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Uploads mount point (volume target per compose)
RUN mkdir -p /app/uploads

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
