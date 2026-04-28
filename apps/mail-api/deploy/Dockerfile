FROM node:22-alpine
WORKDIR /app

# su-exec is needed for the entrypoint that chowns the volume then drops to
# the node user. apk-static add keeps image small (~250 KiB add).
RUN apk add --no-cache su-exec

# No external runtime deps — @iai/mail-core is a workspace dep we ship via node_modules
COPY package.json .
COPY bootstrap.mjs .
COPY dist ./dist
COPY node_modules ./node_modules

# Persistence dir for inbound webhook evidence (mounted as volume in
# production). Pre-chown to node:node so the default case works without
# the entrypoint's runtime chown — the entrypoint is defensive for the
# bind-mount-owned-by-root case discovered on 2026-04-28 (see
# docs/iai-mail-platform/MAIL_IAI_ONE_INBOUND_WEBHOOK_PATH_B_DEPLOY_COMPLETE_2026-04-28.md).
RUN mkdir -p /var/lib/iai-mail-api && chown -R node:node /var/lib/iai-mail-api /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as root only briefly so the entrypoint can chown the bind-mount.
# The entrypoint exec's `su-exec node:node ...` so the main process is uid 1000.
EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "bootstrap.mjs"]
