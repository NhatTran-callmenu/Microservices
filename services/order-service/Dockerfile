
FROM node:24-alpine

WORKDIR /app/services/order-service

COPY services/order-service/package*.json ./

RUN npm ci --omit=dev

COPY services/order-service/src ./src

COPY protos /app/protos

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
