FROM node:22-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts
COPY index.html vite.config.ts tsconfig*.json eslint.config.js ./
COPY src/ src/
COPY public/ public/
ARG VITE_ENTRA_TENANT_ID
ARG VITE_ENTRA_CLIENT_ID
ARG VITE_ENTRA_API_SCOPE
RUN npm run build


FROM node:22-alpine AS server-deps

WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --ignore-scripts


FROM node:22-alpine

WORKDIR /app
COPY --from=frontend-build /app/dist ./dist
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "--import", "tsx", "server/src/index.ts"]
