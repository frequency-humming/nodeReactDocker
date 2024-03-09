FROM --platform=linux/amd64 node:alpine
# Install curl
RUN apk add --no-cache curl openssl

RUN mkdir -p /home/app
ENV NODE_ENV=production
ENV user=admin
ENV database=test_db
ENV password=mypassword
# Copy the entrypoint script into the Docker image
COPY ./entrypoint.sh /home/app/
RUN chmod +x /home/app/entrypoint.sh

COPY ./app /home/app
WORKDIR /home/app/server
COPY ../.././server.crt /home
RUN chmod 644 /home/server.crt
RUN npm install
RUN npm run build

EXPOSE 8000

# Set entrypoint as the entrypoint script
ENTRYPOINT ["/home/app/entrypoint.sh"]

CMD ["node","/home/app/server/index.js"]