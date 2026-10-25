
FROM node:24-alpine

WORKDIR /app/services/customer-service

COPY services/customer-service/package*.json ./

RUN npm ci --omit=dev

COPY services/customer-service/src ./src

COPY protos /app/protos

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
