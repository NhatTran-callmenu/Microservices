
FROM node:24-alpine

WORKDIR /app/services/auth-service

COPY services/auth-service/package*.json ./

RUN npm ci --omit=dev

COPY services/auth-service/src ./src

COPY protos /app/protos

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
