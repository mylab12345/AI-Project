# syntax=docker/dockerfile:1
# =============================================================================
#  AI Campus Opportunity Agent — static site image
#  -------------------------------------------------------------------------
#  The website is pure HTML + CSS + JavaScript (no framework, no build step),
#  so this image is deliberately tiny: we take the official nginx "alpine"
#  image and copy the three files of website/ into the web root.
#
#  Build :  docker build -t campus-agent-web:local .
#  Run   :  docker compose up -d --build      (see docker-compose.yml)
# =============================================================================

# "stable-alpine" always points at the current stable nginx on Alpine Linux.
# ("nginx:alpine" works too, if you ever want the mainline build instead.)
FROM nginx:stable-alpine

LABEL org.opencontainers.image.title="AI Campus Opportunity Agent" \
      org.opencontainers.image.description="Community Engineering Project (BIT42304) — one-page site with a live in-browser demo dashboard" \
      org.opencontainers.image.source="https://github.com/mylab12345/AI-Project" \
      org.opencontainers.image.licenses="MIT"

# --- 1. Our nginx server block -------------------------------------------------
# Replaces the stock default.conf (gzip, caching, hardening headers, /healthz).
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# --- 2. The site itself -------------------------------------------------------
# Only the website/ folder is copied, so README.md / *.md docs never end up
# inside the image.
COPY website/ /usr/share/nginx/html/

# --- 3. Sanity check at build time -------------------------------------------
# "nginx -t" verifies the config we just replaced. If the config has a typo,
# the build fails here instead of the container crash-looping later.
RUN nginx -t

EXPOSE 80

# --- 4. Container health check ------------------------------------------------
# nginx:alpine ships busybox wget (no curl), so we use that against /healthz.
# docker-compose.yml waits for this to report "healthy" before starting the
# Cloudflare tunnel, so the public URL never appears before the site is up.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -T 3 -O /dev/null http://127.0.0.1/healthz || exit 1

# nginx:stable-alpine already has:  CMD ["nginx", "-g", "daemon off;"]
