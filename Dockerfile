# Stage 1: Build Frontend
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup Server
FROM node:20-alpine
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/server /app/dist /app/server/uploads

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ .

# Copy built frontend from builder stage
COPY --from=builder /app/dist ../dist

# Set permissions
RUN chmod 777 uploads && chmod -R 777 data

EXPOSE 3000

CMD ["node", "server.js"]
