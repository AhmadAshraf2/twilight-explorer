# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build
WORKDIR /app
# Manifests first so the npm ci layer survives source-only changes
COPY package.json package-lock.json ./
COPY packages/web/package.json packages/web/package.json
RUN npm ci
COPY packages ./packages
# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
# Real environment variables take precedence over the tracked .env.production.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app /app
WORKDIR /app/packages/web
EXPOSE 3000
CMD ["npm", "run", "start"]
