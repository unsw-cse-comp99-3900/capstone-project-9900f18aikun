FROM node:16 as build

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install @mui/material @emotion/react @emotion/styled
RUN npm install @mui/x-date-pickers
RUN npm install dayjs
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY ./key/www.huoyingzhe.com.crt /etc/nginx/ssl/www.huoyingzhe.com.crt
COPY ./key/www.huoyingzhe.com.key /etc/nginx/ssl/www.huoyingzhe.com.key

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
