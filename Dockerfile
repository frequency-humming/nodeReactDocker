FROM node:13-alpine

RUN mkdir -p /home/app
ENV NODE_ENV=production

COPY ./app /home/app
WORKDIR /home/app/server
RUN npm install
RUN npm run build

EXPOSE 8000

CMD ["node","/home/app/server/index.js"]