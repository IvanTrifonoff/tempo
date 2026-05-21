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
COPY CHANGELOG.md ./CHANGELOG.md
COPY src/constants.tsx ./src/constants.tsx

# Create uploads and set permissions
RUN mkdir -p /app/server/uploads && \
    chown -R node:node /app

# Copy entrypoint script
COPY --chmod=755 server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node
WORKDIR /app/server

EXPOSE 3000

CMD ["/usr/local/bin/docker-entrypoint.sh"]