FROM node:16 as build

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]