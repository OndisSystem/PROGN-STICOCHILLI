FROM node:22-bookworm-slim
ENV NODE_ENV=production DB_PATH=/data/prognostico.sqlite PORT=3000 HOST=0.0.0.0 SECURE_COOKIES=1
WORKDIR /app
COPY --chown=node:node . .
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
