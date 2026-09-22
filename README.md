# AI Campus Opportunity Agent — TGPCET (Project 3)

A one-page website for the Community Engineering Project **BIT42304** (IT Dept, II Year, III Sem, Sec B — project by Mr. T. P. Raju).
It presents the AI Campus Opportunity Agent concept **and** includes a fully working in-browser demo dashboard (profile → AI match score → filters → save → reminders → to-do).

Pure front-end: **HTML + CSS + JavaScript only**. No frameworks, no build step.

```
website/
├── index.html   # structure — every section (Problem, Aim, Features, How It Works, Live Demo, Tech Stack, Innovation, Future)
├── styles.css   # dark-violet theme, hero mockups (laptop/phone/notification built in pure CSS), responsive + hamburger menu
└── app.js       # demo logic: opportunity data, matching score, filters, save/remove, to-do, reminders, scrollspy
```

## Run it

```bash
cd website
python3 -m http.server 8080     # then open http://localhost:8080
```

…or simply double-click `website/index.html`.

## Run it in Docker (Windows 10 + public URL)

The repo ships a Dockerfile, an nginx config and a Compose stack, so the site can run in a container and
be published on the Internet through a **Cloudflare Tunnel** — no port forwarding, no static IP.

```bash
docker compose up -d --build                       # local:  http://localhost:8080
docker compose --profile quick up -d --build       # + free public https://<random>.trycloudflare.com URL
docker compose logs cloudflared-quick              # read the public URL from the logs
```

`--profile named` publishes a permanent URL on your own domain (set `CLOUDFLARE_TUNNEL_TOKEN` in `.env`).
Copy `.env.example` to `.env` first if you need to change the host port.

**👉 Full step-by-step walkthrough (installing Docker on Windows 10, WSL 2, the tunnel, troubleshooting):
[WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md](WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md)**

| File | Purpose |
| --- | --- |
| `Dockerfile` | nginx:alpine image containing `website/` |
| `nginx/default.conf` | gzip, caching, security headers, `/healthz` |
| `docker-compose.yml` | `web` + `cloudflared-quick` + `cloudflared-named` services |
| `.env.example` | local port + Cloudflare tunnel token template |

## Features

- Sticky navbar with 7 smooth-scrolling tabs + scrollspy highlight + mobile hamburger menu
- Hero section with pure-CSS product mockups (no images)
- **Live Demo**: enter skills/interests → ranked % matches → filter chips → save applications → deadline reminders → to-do list
- Saved items & to-dos persist across refresh (localStorage), user input is HTML-escaped
- Fully responsive (desktop / tablet / phone), accessible (ARIA, focus styles, reduced-motion)

## Documentation

**[CODE_GUIDE.md](CODE_GUIDE.md)** explains every detail — which code is responsible for which part: file-by-file, section-by-section, function-by-function, plus the full list of fixes/enhancements and verification results (44 automated checks).

**[WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md](WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md)** is the deployment guide: install Docker Desktop on Windows 10 (WSL 2), run this site in a container, and get a public HTTPS URL with Cloudflare Tunnel (quick tunnel and named tunnel), plus troubleshooting, fallbacks and a command cheat-sheet.
