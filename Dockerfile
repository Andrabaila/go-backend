FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages ./packages
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
