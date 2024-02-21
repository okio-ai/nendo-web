# ---- Dev Stage ----
FROM node:21 AS dev-stage

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "devcontainer"]

# ---- Build Stage ----
FROM node:16 AS build-stage

ARG SERVER_URL=http://localhost
ENV VITE_API_URL=$SERVER_URL

WORKDIR /app
COPY package*.json ./
RUN npm install

# build the app (sets NODE_ENV=production)
COPY . .
RUN npm run build

# ---- Run Stage ----
FROM nginx:1.25.1-alpine AS run-stage

RUN adduser -u 1000 -D -S -G www-data www-data

# Remove default nginx static resources
RUN rm -rf /usr/share/nginx/html/*

# Copy static build directory from builder stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Containers run nginx with global directives and daemon off
CMD ["nginx", "-g", "daemon off;"]
