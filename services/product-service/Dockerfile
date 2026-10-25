
FROM node:24-alpine

WORKDIR /app/services/product-service

COPY services/product-service/package*.json ./

RUN npm ci --omit=dev

COPY services/product-service/src ./src

COPY protos /app/protos

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
