# Base image pinned by digest (the multi-arch index of node:22-alpine, read from the
# registry on 2026-10-09). Bump the digest deliberately when the base image is updated.
FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
WORKDIR /app

# Production image: mail-api must not seed the dev SMTP login (smtp-dev /
# dev-secret / ws_dev) into the database it opens. `docker run -e NODE_ENV=...`
# or --env-file still overrides this for a local smoke.
ENV NODE_ENV=production

# No external runtime deps — @iai/mail-core is a workspace dep we ship via node_modules
COPY package.json .
COPY bootstrap.mjs .
COPY dist ./dist
COPY node_modules ./node_modules

# Persistence dir for inbound webhook evidence (mounted as volume in production).
# The process runs as the unprivileged `node` user (uid 1000), so a bind-mounted
# host directory must already be writable by uid 1000 (see README, "Volume contract").
RUN mkdir -p /var/lib/iai-mail-api && chown -R node:node /var/lib/iai-mail-api /app

COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node

# Liveness only (/health checks that SQLite answers; /ready also checks the queue).
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PATH_B_PORT||3001)+'/health').then((r)=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "bootstrap.mjs"]
