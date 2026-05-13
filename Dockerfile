FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY src ./src

USER node

CMD ["node", "src/app/server.js"]