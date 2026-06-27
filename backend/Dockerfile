# Stage 1: Build the backend application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (including typescript and devDependencies)
RUN npm ci

# Copy the rest of the backend files
COPY . .

# Build the TypeScript code (runs tsc, outputting to dist)
RUN npm run build

# Copy schema.sql to the dist folder so compiled seeding script can find it
RUN cp src/db/schema.sql dist/db/schema.sql 2>/dev/null || mkdir -p dist/db && cp src/db/schema.sql dist/db/schema.sql

# Stage 2: Runtime environment
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript files and assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Start Express server
CMD ["node", "dist/index.js"]
