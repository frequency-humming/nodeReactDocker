FROM --platform=linux/amd64 node:alpine

# Install curl and openssl
RUN apk add --no-cache curl openssl

# Create app directory
RUN mkdir -p /home/app

# Copy entrypoint script
COPY ./entrypoint.sh /home/app/
RUN chmod +x /home/app/entrypoint.sh

# Copy the entire app directory (contains client and server)
COPY ./app /home/app

# Copy SSL certificate
COPY ./server.crt /home/
RUN chmod 644 /home/server.crt

# Install server dependencies
WORKDIR /home/app/server
RUN npm install

# Use the server's build script which handles client build
RUN npm run build

EXPOSE 8000

# Uncomment if you need entrypoint
ENTRYPOINT ["/home/app/entrypoint.sh"]

CMD ["npm", "start"]