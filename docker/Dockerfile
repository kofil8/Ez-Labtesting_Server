# ===========================================
# 🏗 Stage 1: Base Image (shared between dev/prod)
# ===========================================
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./

# ARG to switch between dev/prod installs
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install dependencies based on environment
RUN if [ "$NODE_ENV" = "development" ]; then npm install; else npm install --omit=dev; fi

# Copy rest of the app
COPY . .

# ===========================================
# 🧰 Stage 2: Build (only for TypeScript)
# ===========================================
FROM base AS build
RUN npm run build
RUN npx prisma generate

# ===========================================
# 🚀 Stage 3: Production Runtime
# ===========================================
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Copy only required files for runtime
COPY --from=build /usr/src/app/package*.json ./
RUN npm install --omit=dev

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma

EXPOSE 5000
CMD ["node", "dist/server.js"]

# ===========================================
# 🧑‍💻 Stage 4: Development Runtime
# ===========================================
FROM base AS development
WORKDIR /usr/src/app

# Hot reload for local dev
EXPOSE 5000
CMD ["npm", "run", "dev"]
