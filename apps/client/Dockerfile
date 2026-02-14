# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# We use 'npm install' here for development convenience.
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine AS runner

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for React Router support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
