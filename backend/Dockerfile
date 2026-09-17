# Build context: repository root (see docker-compose.yml)

# ---- Build: install all dependencies and compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app

# The lockfile lives in the root because the repo uses npm workspaces
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend

COPY backend/ backend/
RUN npm run build --workspace backend

# ---- Runtime: only production dependencies and the compiled code ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --omit=dev

COPY --from=build /app/backend/dist backend/dist

WORKDIR /app/backend
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
