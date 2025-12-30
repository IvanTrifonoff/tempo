# Stage 1: Build Frontend
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Setup Server
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server code and build
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Create uploads and set permissions
# Note: If using host volumes, ensure UID 1000 has write access on host
RUN mkdir -p /app/server/uploads && \
    chown -R node:node /app

USER node
WORKDIR /app/server

EXPOSE 3000

CMD ["node", "server.js"]