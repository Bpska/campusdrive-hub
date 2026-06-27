# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (using npm ci for clean, reproducible builds)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TanStack Start app (runs vite build, outputting to .output)
RUN npm run build

# Stage 2: Runtime environment
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy only the compiled output from the builder stage
COPY --from=builder /app/.output ./.output

# Expose the server port
EXPOSE 3000

# Start the Nitro node-server
CMD ["node", ".output/server/index.mjs"]
