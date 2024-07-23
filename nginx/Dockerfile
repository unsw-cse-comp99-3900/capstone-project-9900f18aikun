FROM nginx:alpine


COPY nginx.conf /etc/nginx/nginx.conf

COPY ./www.huoyingzhe.com.crt /etc/nginx/ssl/www.huoyingzhe.com.crt
COPY ./www.huoyingzhe.com.key /etc/nginx/ssl/www.huoyingzhe.com.key


EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
