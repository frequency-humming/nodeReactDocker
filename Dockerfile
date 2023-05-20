FROM node:13-alpine

RUN apk add --no-cache curl

RUN mkdir -p /home/app
ENV NODE_ENV=production
ENV user=admin
ENV database=test_db
ENV password=mypassword

COPY ./entrypoint.sh /home/app/
RUN chmod +x /home/app/entrypoint.sh

COPY ./app /home/app
WORKDIR /home/app/server
RUN npm install
RUN npm run build

EXPOSE 8000

ENTRYPOINT ["/home/app/entrypoint.sh"]

CMD ["node","/home/app/server/index.js"]