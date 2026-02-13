# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# We use 'npm install' here for development convenience.
# In strict production, use 'npm ci' with a generated package-lock.json.
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "dist/index.js"]
