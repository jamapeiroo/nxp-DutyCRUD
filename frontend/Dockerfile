# Build context: repository root (see docker-compose.yml)

# ---- Build: compile the React app into static files ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend

COPY frontend/ frontend/

# Vite writes the API URL into the bundle at build time
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace frontend

# ---- Runtime: serve the static files with nginx ----
FROM nginx:1.27-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
