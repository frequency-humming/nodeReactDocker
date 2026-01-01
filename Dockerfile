FROM --platform=linux/amd64 node:alpine


# RUN apk add --no-cache curl openssl
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs appuser

# Create app directory
RUN mkdir -p /home/app && chown -R appuser:nodejs /home/app

# Copy entrypoint script
COPY --chown=appuser:nodejs ./entrypoint.sh /home/app/
RUN chmod +x /home/app/entrypoint.sh

# Copy the entire app directory (contains client and server)
COPY --chown=appuser:nodejs ./app /home/app

# Copy SSL certificate
# COPY ./server.crt /home/
# RUN chmod 644 /home/server.crt

# Install server dependencies
WORKDIR /home/app/server

USER appuser

# clean up to reduce image size
RUN npm install \
    && npm run build \
    && npm prune --omit=dev \
    && cd ../client && npm prune --omit=dev \
    && rm -rf ~/.npm /tmp/* \
    && npm cache clean --force

# Set production environment for runtime
ENV NODE_ENV=production

EXPOSE 8000

# Uncomment if you need entrypoint
ENTRYPOINT ["/home/app/entrypoint.sh"]

CMD ["npm", "start"]