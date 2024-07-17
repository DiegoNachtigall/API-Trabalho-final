FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm install @prisma/client

EXPOSE 3000

CMD ["npm", "run", "dev"]