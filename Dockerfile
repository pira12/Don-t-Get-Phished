# Server-mode image (API routes on) for the self-hosted / enterprise stack.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
