# 🪟 Run the AI Campus Opportunity Agent on Windows 10 (Docker + Cloudflare Tunnel)

A complete, copy-paste walkthrough that takes a plain Windows 10 laptop and ends with:

1. **Docker Desktop installed and working** on Windows 10 (WSL 2 backend),
2. the **website running inside a Docker container** on your PC,
3. a **public HTTPS URL** (something like `https://random-words.trycloudflare.com`) that anyone —
   your professor, classmates, or a friend on mobile data — can open from anywhere in the world,
   **without opening a single port on your router or firewall.**

> **Time needed:** about 45–60 minutes, most of which is downloading Docker Desktop and Windows updates.

---

## ⚡ TL;DR (if Docker Desktop is already installed and working)

```powershell
cd $HOME\Documents\AI-Project                     # the folder with docker-compose.yml
docker compose up -d --build                      # local site   → http://localhost:8080
docker compose --profile quick up -d --build      # public site  → https://<random>.trycloudflare.com
docker compose logs cloudflared-quick             # read the public URL out of the log banner
docker compose down                               # stop everything
```

For a **permanent** URL on your own domain, see [Option B](#43-option-b--named-tunnel-permanent-url-on-your-own-domain).
Everything else in this guide is the from-zero Windows 10 setup, verification and troubleshooting.

---

## Table of contents

| # | Section |
|---|---------|
| 0 | [What you will end up with](#0-what-you-will-end-up-with) |
| 1 | [Requirements checklist (Windows 10)](#1-requirements-checklist-windows-10) |
| 2 | [Part 1 — Install Docker on Windows 10](#part-1--install-docker-on-windows-10) |
| 3 | [Part 2 — Get this project onto your PC](#part-2--get-this-project-onto-your-pc) |
| 4 | [Part 3 — Run the website locally in Docker](#part-3--run-the-website-locally-in-docker) |
| 5 | [Part 4 — Create the public URL with Cloudflare](#part-4--create-the-public-url-with-cloudflare) |
| 6 | [Part 5 — Verify it is really public](#part-5--verify-it-is-really-public) |
| 7 | [Part 6 — Day-to-day: start, stop, update](#part-6--day-to-day-start-stop-update) |
| 8 | [Troubleshooting](#troubleshooting) |
| 9 | [Security notes](#security-notes) |
| A | [Appendix A — No-Docker fallback (plain Windows)](#appendix-a--no-docker-fallback-plain-windows) |
| B | [Appendix B — If Docker Desktop will not install](#appendix-b--if-docker-desktop-will-not-install) |
| C | [Appendix C — What each new file does](#appendix-c--what-each-new-file-does) |
| D | [Appendix D — Command cheat-sheet + glossary](#appendix-d--command-cheat-sheet--glossary) |
| E | [References](#appendix-e--references) |

**Conventions used below**

* Commands in a `powershell` block are typed in **PowerShell** (press `Win`, type *PowerShell*).
* Lines starting with `#` are comments — do not type them.
* 🛑 *Admin* means: open PowerShell by right-clicking → **Run as administrator**.
* ✅ *Checkpoint* means: you should see that output before continuing.

---

## 0. What you will end up with

```
            Visitor in a browser (phone, laptop, another city)
                              │
                              │  https://xxxx.trycloudflare.com   ← the public URL
                              ▼
                  ┌───────────────────────────┐
                  │      Cloudflare edge      │   HTTPS certificate, DDoS protection,
                  │      (global network)     │   caching — nothing to configure
                  └─────────────┬─────────────┘
                                │  outbound-only tunnel (QUIC/HTTPS, port 443/7844)
       ┌────────────────────────┴─────────────────────────┐
       │  Your Windows 10 PC  —  Docker Desktop (WSL 2)   │
       │                                                  │
       │   ┌────────────────────┐   ┌──────────────────┐  │
       │   │  container:        │   │  container:      │  │
       │   │  cloudflared       │──▶│  web  (nginx)    │  │
       │   │  (the tunnel)      │   │  website/*.html  │  │
       │   └────────────────────┘   └────────┬─────────┘  │
       │         internal Docker network ────┘            │
       │                                     │            │
       └─────────────────────────────────────┼────────────┘
                                             │  127.0.0.1:8080 → container port 80
                                    your own browser:  http://localhost:8080
```

Two independent things are happening, and it helps to keep them apart:

| Layer | What it does | Reachable from |
|---|---|---|
| `web` container (nginx) | Serves `website/index.html`, `styles.css`, `app.js` | Your PC (`http://localhost:8080`) **and** the tunnel container (`http://web:80`) |
| `cloudflared` container | Dials **out** to Cloudflare and asks it to forward a public hostname to `http://web:80` | The whole Internet, via the `https://…` URL |

Because `cloudflared` connects *outward*, **no port forwarding, no static IP, no firewall rule and no
router configuration is required.** That is the whole point of Cloudflare Tunnel.

### Files this repository adds for you

| File | Purpose |
|---|---|
| `Dockerfile` | Builds the website image from `nginx:stable-alpine` + the `website/` folder |
| `nginx/default.conf` | nginx server block: gzip, caching, security headers, `/healthz` endpoint |
| `docker-compose.yml` | The 3 services: `web`, `cloudflared-quick`, `cloudflared-named` |
| `.env.example` | Template for your local port and your Cloudflare tunnel token |
| `.dockerignore`, `.gitignore` | Keep the image small and keep `.env` (your secret token) out of Git |

---

## 1. Requirements checklist (Windows 10)

Go through this table **before** downloading anything. Most installation failures on Windows 10
are one of these five items.

| # | Requirement | Why | How to check |
|---|---|---|---|
| 1 | **Windows 10 22H2, build 19045 or higher** | Current Docker Desktop releases refuse to install on 21H2 (build 19044) and older | `winver` → look at "OS Build". Or see [step 1 of Part 1](#step-1--check-your-windows-10-build) |
| 2 | **64-bit CPU with SLAT** + **virtualization enabled in BIOS/UEFI** | WSL 2 runs a lightweight Linux VM | Task Manager → **Performance** → **CPU** → "Virtualization: **Enabled**" |
| 3 | **WSL 2 version 2.1.5 or later** | Docker Desktop's default backend | `wsl --version` (see [Part 1 step 4](#step-4--install--update-wsl-2)) |
| 4 | **8 GB RAM** (4 GB works for this tiny site, but 8 GB is the official minimum) | Docker Desktop + WSL 2 | Settings → System → About |
| 5 | **~5 GB free disk space on `C:`** | Docker Desktop + the Linux image | File Explorer → This PC |

Also useful:

* **Windows 10 Home, Pro, Enterprise or Education** all work. Home/Education can run **Linux
  containers** (which is all we need); running *Windows* containers additionally requires Pro/Enterprise.
* **Internet connection** during setup — Docker pulls images from Docker Hub, and Cloudflare needs an
  outbound connection at run time.
* **Administrator rights for one step only**: enabling WSL 2 for the first time is a per-machine,
  one-time operation. Docker Desktop itself can be installed per-user without admin rights
  (installation mode **per-user**, which is the recommended default).
* Docker Desktop is **free for personal use, education and non-commercial open source projects** —
  a college project qualifies. (Only companies with 250+ employees or $10M+ revenue need a paid plan.)

> ### ⚠️ Important note about Windows 10 in 2026
> Microsoft ended standard support for Windows 10 on **14 October 2025**, and Docker only supports
> Docker Desktop on Windows versions still inside Microsoft's servicing timeline.
> In practice this means:
>
> * On **Windows 10 22H2 (build 19045)** the current Docker Desktop still installs and runs (the
>   official system requirements list exactly this build). Patch your PC first.
> * On **Windows 10 21H2 (build 19044) or older**, current Docker Desktop installers are **blocked**.
>   Use [Appendix B](#appendix-b--if-docker-desktop-will-not-install) instead.
> * Treat this as a temporary arrangement: whenever you can, move to Windows 11 — or use the
>   no-Docker path in [Appendix A](#appendix-a--no-docker-fallback-plain-windows), which has no OS
>   version constraint at all.

---

## Part 1 — Install Docker on Windows 10

### Step 1 — Check your Windows 10 build

Open PowerShell (no admin needed) and run:

```powershell
winver
```

A little window pops up. You want:

```
Windows 10  →  Version 22H2  →  OS Build 19045.xxxx
```

Or, without a popup, in PowerShell:

```powershell
(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion') |
  Select-Object DisplayVersion, CurrentBuild, UBR
```

✅ *Checkpoint:* `CurrentBuild` must be **19045 or higher**.

* If it is **19044 / 21H2 or lower** → first try to update: **Settings → Update & Security →
  Windows Update → Check for updates** (if the *Windows 10 22H2 enablement package* is offered, take it),
  then run `winver` again. Still below 19045? Jump to [Appendix B](#appendix-b--if-docker-desktop-will-not-install).
* If you see build **22000+** you are on Windows 11 — the same guide works, ignore the Windows 10 notes.

### Step 2 — Turn on hardware virtualization

1. Open **Task Manager** (`Ctrl+Shift+Esc`) → **Performance** tab → **CPU**.
2. Look at the bottom-right for **Virtualization**.
   * **Enabled** → continue.
   * **Disabled** → you must enable it in BIOS/UEFI: restart the PC, tap `F2` / `F10` / `Del` /
     `Esc` (vendor-dependent) during boot, then find and enable one of these options, save and exit:
     * **Intel VT-x** / *Intel Virtualization Technology* / *Vanderpool*
     * **AMD-V** / *SVM Mode* / *AMD Secure Virtual Machine*
     * sometimes under *Advanced → CPU Configuration → Intel Virtualization Technology*
   * On some laptops you must also keep **Hyper-V**/Virtualization enabled and disable
     "Fast Boot" for the setting to stick.

✅ *Checkpoint:* Task Manager shows **Virtualization: Enabled**.

### Step 3 — Make sure your Windows is up to date

**Settings → Update & Security → Windows Update → Check for updates** → install everything → **restart**.

This matters: `wsl --install` and the WSL 2 kernel rely on recent servicing-stack updates.

### Step 4 — Install / update WSL 2

Open **PowerShell as administrator** 🛑 (right-click PowerShell → *Run as administrator*):

```powershell
# 1. Check what you currently have
wsl --version

# 2. If the command prints version details, make sure the WSL version is 2.1.5 or later.
#    If it says "command not recognized", WSL is not installed yet.
wsl --update

# 3. If WSL was not installed at all, install it (this enables the two Windows features,
#    downloads the Linux kernel and installs Ubuntu). A RESTART may be requested.
wsl --install

# 4. Make WSL 2 the default for every distro from now on
wsl --set-default-version 2

# 5. See the list of installed Linux distros and their WSL version
wsl -l -v
```

> **Windows 10 note:** `wsl --install` works on Windows 10 version 2004 (build 19041) and later, so it
> is fine on 21H2/22H2. If your PC has no Microsoft Store access, download the WSL **`.msi`** package
> from <https://github.com/microsoft/WSL/releases> and install it manually.

Alternative, fully manual way to enable the two Windows features (only if `wsl --install` fails) 🛑:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
# then RESTART Windows
```

✅ *Checkpoint:* `wsl --version` prints `WSL version: 2.x.x` (2.1.5+) and `wsl -l -v` shows
`STATE = Running` with `VERSION = 2` for your distro.

### Step 5 — Download Docker Desktop

Official download locations:

* Download page: <https://www.docker.com/products/docker-desktop/> 
* Direct file: <https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe> 
* Docs + requirements: <https://docs.docker.com/desktop/setup/install/windows-install/>

The file is called **`Docker Desktop Installer.exe`** (~700 MB–1 GB). On Windows 10 Home you may be
offered the Microsoft Store version instead — either works, but this guide uses the `.exe`.

### Step 6 — Run the installer

**Option A — the normal way (recommended)**

1. Double-click `Docker Desktop Installer.exe`.
2. Choose installation mode: **per-user** (recommended, no admin rights, installs to
   `%LOCALAPPDATA%\Programs\DockerDesktop`). Choose *all users* only if you need Windows containers.
3. On the **Configuration** page, keep **"Use WSL 2 instead of Hyper-V (recommended)"** ticked.
4. Click through the wizard, allow the UAC prompt if asked, and click **Close** when finished.

**Option B — silent install from PowerShell** 🛑 (admin only for *all users* mode)

```powershell
# Per-user install, no admin needed (recommended):
Start-Process 'Docker Desktop Installer.exe' -Wait -ArgumentList 'install','--user','--accept-license','--backend=wsl-2'

# All-users install (requires an elevated PowerShell):
Start-Process 'Docker Desktop Installer.exe' -Wait -ArgumentList 'install','--accept-license','--backend=wsl-2'
```

If you used *all users* mode and your Windows account is not the installing admin account, add
yourself to the `docker-users` group 🛑:

```powershell
net localgroup docker-users $env:USERNAME /add
```

### Step 7 — First start and the settings that matter

1. Press `Win`, type **Docker Desktop**, press `Enter`.
2. **Accept** the Docker Subscription Service Agreement (it is free for education/personal use).
3. You can **skip signing in** — a Docker Hub account is *not* required to run this project. If
   Docker Hub rate-limits you later, signing in raises the limit.
4. Wait for the whale icon in the system tray to stop animating. That can take 1–2 minutes on the
   first boot.
5. Open **Settings** (gear icon) and confirm:

| Setting | Where | Value for this project |
|---|---|---|
| Start Docker Desktop when you sign in | **General** | ✅ on — so the public URL survives reboots |
| Use the WSL 2 based engine | **General** | ✅ on |
| Resources → WSL Integration | **Resources** | ✅ enable for your distro (e.g. Ubuntu) |
| Disk image location | **Resources → Advanced** | leave default (`C:`) or point to a bigger drive |
| Proxy | **Resources → Proxies** | leave *System* unless your college network requires an explicit proxy |

> **Windows Defender Firewall:** on first start Windows may ask whether to allow Docker Desktop.
> Allow it for **private networks**. Nothing needs to be opened inbound for this project — the tunnel
> only makes outbound connections.

### Step 8 — Verify the installation

```powershell
docker --version
docker compose version
docker info --format '{{.ServerVersion}} | {{.OperatingSystem}}'
docker run --rm hello-world
```

✅ *Checkpoint:* `hello-world` prints `Hello from Docker! …` and then the container removes itself.
That single command proves all four layers work: CLI → Docker daemon → WSL 2 → Docker Hub.

If any of that fails, see [Troubleshooting → Docker installation](#a-docker-installation--start-up).

---

## Part 2 — Get this project onto your PC

### Option A — Clone with Git (best if you will keep editing)

Install **Git for Windows** from <https://git-scm.com/download/win> (default options are fine), then:

```powershell
cd $HOME\Documents
git clone https://github.com/mylab12345/AI-Project.git
cd AI-Project
```

### Option B — Download a ZIP (no Git needed)

1. Open <https://github.com/mylab12345/AI-Project>.
2. **Code ▾ → Download ZIP**.
3. Right-click the ZIP → **Extract All…** → extract to e.g. `C:\Users\<you>\Documents\AI-Project`.

### Where to put the folder — and where not to

Put the project somewhere like `C:\Users\<you>\Documents\AI-Project` or `C:\dev\AI-Project`.

❌ **Do not** put it in a **OneDrive / Google Drive** synced folder or on a network/VM shared drive:
Docker Desktop's WSL 2 backend uses these folders as a *build context*, and sync clients constantly
touch the files, which causes slow builds and random file-lock errors.

✅ *Checkpoint:* the folder contains (at least):

```
AI-Project\
├── Dockerfile                 ← new
├── docker-compose.yml         ← new
├── .env.example               ← new
├── nginx\
│   └── default.conf           ← new
├── website\
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── README.md
└── WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md
```

---

## Part 3 — Run the website locally in Docker

In PowerShell, go to the project folder (the one with `docker-compose.yml` in it):

```powershell
cd $HOME\Documents\AI-Project

# Build the image and start the stack in the background
docker compose up -d --build
```

What happens on the first run (about 1–2 minutes, mostly downloads):

```
[+] Building 12.4s (10/10) FINISHED
 => [1/3] FROM docker.io/library/nginx:stable-alpine
 => [2/3] COPY nginx/default.conf /etc/nginx/conf.d/default.conf
 => [3/3] COPY website/ /usr/share/nginx/html/
[+] Running 2/2
 ✔ Network campus-agent_webnet  Created
 ✔ Container campus-agent-web   Started
```

Then check it:

```powershell
docker compose ps          # STATUS should say "Up ... (healthy)"
docker compose logs web    # nginx access/error log
```

Now open your browser at:

### 👉 <http://localhost:8080>

You should see the full **AI Campus Opportunity Agent** page, and the *Live Demo* section must work
(type skills → **Find My Matches** → ranked opportunities). That confirms `app.js` and `styles.css`
are being served correctly.

> **Port 8080 already in use?** Create a `.env` file and change the port:
> ```powershell
> Copy-Item .env.example .env
> notepad .env          # set WEB_PORT=8090
> docker compose up -d --build
> ```
> Then browse to <http://localhost:8090>. (Also undo it by deleting the line/setting `WEB_PORT=8080`.)

### Everyday commands for the local stack

| Goal | Command |
|---|---|
| Start (and build if something changed) | `docker compose up -d --build` |
| Stop and remove the containers + network | `docker compose down` |
| Stop without removing | `docker compose stop` |
| Restart just the website | `docker compose restart web` |
| See what is running | `docker compose ps` |
| Follow logs live | `docker compose logs -f` |
| Logs of one service | `docker compose logs -f web` |
| Shell inside the site container | `docker compose exec web sh` |
| Look at the served file from inside | `docker compose exec web ls -l /usr/share/nginx/html` |
| Rebuild after editing `website/` files | `docker compose up -d --build` |
| Remove unused images/cache (frees GBs) | `docker system prune -af` ⚠️ deletes unused images |

---

## Part 4 — Create the public URL with Cloudflare

### 4.1 How Cloudflare Tunnel works (30-second version)

A program called **`cloudflared`** runs inside a container on your PC. It opens an **outbound-only**
connection to Cloudflare's global network (HTTPS 443 / QUIC 7844). When a visitor opens your public
URL, Cloudflare sends that request back down *through the connection your PC already established* to
the `cloudflared` container, which forwards it to `http://web:80` (the nginx container).

Consequences you should remember:

* No inbound ports, no port forwarding on the router, no public IP — it works on college Wi-Fi, home
  broadband and even mobile hotspot.
* Visitors get **HTTPS automatically**; no certificate to buy or renew.
* If you stop the containers or the laptop sleeps, the URL stops working.

### 4.2 Option A — Quick Tunnel (no account, ~2 minutes) 🔥 recommended for demos

A **Quick Tunnel** gives you a free random `*.trycloudflare.com` address. Nothing to sign up for.

```powershell
# from the project folder
docker compose --profile quick up -d --build
```

Now read the public address out of the tunnel container's log:

```powershell
docker compose logs cloudflared-quick
```

Look for this banner:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://amber-lion-creek-bravo.trycloudflare.com                                          |
+--------------------------------------------------------------------------------------------+
```

One-liner that prints only the URL (PowerShell):

```powershell
docker compose logs cloudflared-quick |
  Select-String -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' |
  ForEach-Object { $_.Matches.Value } | Select-Object -Last 1
```

If you prefer a continuous log view while it starts:

```powershell
docker compose logs -f cloudflared-quick
```

**That URL is live on the Internet.** Open it on your phone with **Wi-Fi turned off** (mobile data) to
prove it — see [Part 5](#part-5--verify-it-is-really-public).

#### Quick Tunnel facts

| Property | Value |
|---|---|
| Cost | Free, no account |
| URL | Random `https://<words>.trycloudflare.com`, **changes** whenever the container is recreated |
| Lifetime | As long as the `cloudflared-quick` container runs (restarting Docker keeps it only if the container is not recreated) |
| Limits | Hard limit of **200 concurrent in-flight requests**; **no Server-Sent Events (SSE)** |
| Best for | College demos, reviews, sharing with a friend, webhook testing |
| Not for | Anything permanent, production, or a link you print on a poster |

> ⚠️ Each time you run `docker compose --profile quick up -d` **after** `docker compose down`, you get a
> **new** random URL. If you need a stable link, use Option B. If you only want it to survive a reboot,
> leave the container running (`restart: unless-stopped` already handles it) and set Docker Desktop to
> start when you sign in.

To stop the tunnel but keep the site local:

```powershell
docker compose --profile quick down        # stops everything
docker compose up -d --build               # start only the local site again
```

### 4.3 Option B — Named Tunnel (permanent URL on your own domain)

Use this when you want a fixed address such as **`https://campus-agent.yourdomain.com`** that stays the
same forever, or when you need the quick-tunnel limits removed. You need a domain name (any registrar —
even a cheap one) added to a **free Cloudflare account**.

**B1. Put a domain on Cloudflare**

1. Create an account: <https://dash.cloudflare.com/sign-up> (free plan is enough).
2. **Add a site** → type your domain → choose the **Free** plan.
3. Cloudflare shows two nameservers. Set them at your registrar (where you bought the domain) and wait
   for the status to become **Active** (minutes to a few hours).
   *No domain?* Skip to Option A, or buy/borrow one — the tunnel itself is free.

**B2. Create the tunnel in the dashboard**

1. Open the Zero Trust dashboard: <https://one.dash.cloudflare.com/>.
2. Go to **Networks → Tunnels** → **Create a tunnel**.
3. Connector type: **Cloudflared** → **Next**. Name it e.g. `campus-agent-win10` → **Save tunnel**.
4. Under **Install connector**, choose the **Docker** tab. You will see a command like:

   ```sh
   docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoi...
   ```

   👉 Copy **only the long token** after `--token` (a single long line, no quotes, no spaces).
   Treat it like a password — it can publish your services.

**B3. Put the token in `.env`**

```powershell
cd $HOME\Documents\AI-Project
Copy-Item .env.example .env          # skip if .env already exists
notepad .env
```

`.env` should now look like:

```ini
WEB_PORT=8080
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJjZGVmMTIzNDU2Nzg5MCIsInQiOiIxMjM0NTY3OC1hYmNk..."
```

Save and close Notepad. (`.env` is already listed in `.gitignore` — it will never be committed.)

**B4. Point a public hostname at the website container** 

Still in the tunnel's **Public Hostname** tab (the second step of the create wizard), click
**Add a public hostname**:

| Field | What to enter |
|---|---|
| Subdomain | `campus-agent` (or anything you like, e.g. `demo`, `project`) |
| Domain | pick your domain from the dropdown |
| Path | leave empty |
| Service → Type | **HTTP** |
| Service → URL | **`web:80`** ← **not** `localhost:8080` |

> ### 🚨 The #1 mistake in this whole guide
> The `cloudflared` container is a *different* computer than your PC. Inside it, `localhost` means
> *the cloudflared container itself*, which serves nothing. Container-to-container traffic uses the
> **Compose service name** over the internal Docker network, so the correct origin is:
>
> **`http://web:80`**
>
> * `web` = the service name defined in `docker-compose.yml`
> * `80`  = the port nginx listens on *inside* its container (the `8080` in
>   `"8080:80"` is only the port on your Windows machine)

Click **Save tunnel**.

**B5. Start the stack with the named tunnel**

```powershell
docker compose --profile named up -d --build
docker compose logs cloudflared-named
```

✅ *Checkpoint:* the log shows `Registered tunnel connection` (often 4 lines, one per Cloudflare
edge location) and the dashboard's tunnel page shows **Status: Healthy**.

Then open **https://campus-agent.yourdomain.com** — HTTPS works immediately.

**B6. If it does not resolve**

* Give DNS a minute: Cloudflare creates the `CNAME` automatically, but propagation can take a moment.
* **Error 1033** = the tunnel is not connected (container stopped / token wrong) → check
  `docker compose logs cloudflared-named`.
* **Error 502 / 530** = the tunnel is up but cannot reach the origin → almost always the
  `web:80` vs `localhost:8080` mistake in B4, or the `web` container is down.
* Wrong hostname in the browser? Verify the **Public Hostname** row exists and its **Service URL** is
  exactly `web:80` with type `HTTP`.

### 4.4 Which option should I use?

| | **Option A — Quick Tunnel** | **Option B — Named Tunnel** |
|---|---|---|
| Cloudflare account | not required | required (free) |
| Domain | not required | required, added to Cloudflare |
| Setup time | ~2 minutes | ~15 minutes + DNS wait |
| URL | random, changes on recreate | yours, permanent |
| Concurrency limit | 200 in-flight requests | no quick-tunnel limit |
| Access policies (Zero Trust) | no | yes (email login, IP rules) |
| Cloudflare WAF / rate limiting | limited | free tier features once the domain is on Cloudflare |
| **Use for** | **Project review, demo to professor** | **Anything you keep sharing** |

You can keep both: start with `--profile quick` for the review, and add `--profile named` later once
you own a domain. Only run **one** tunnel profile at a time.

### 4.5 Optional — require a login before anyone can see the site

If your demo URL should not be world-readable, Cloudflare Access can put an email one-time-PIN in
front of it (free for up to 50 users):

1. Zero Trust → **Access → Applications → Add an application → Self-hosted**.
2. Application domain = your public hostname (`campus-agent.yourdomain.com`).
3. Add a policy: **Action = Allow**, **Include = Emails** → your email + your professor's email.
4. Save. Now visitors must enter an emailed code before the site loads.

(Cloudflare Access requires a domain on Cloudflare, i.e. Option B. It also applies to `localhost`
testing if you add that host — do not.)

---

## Part 5 — Verify it is really public

Do at least three of these — the first one is the only one that really proves it:

1. **Phone on mobile data.** Turn Wi-Fi **off**, open the `https://…` URL in the phone browser. If it
   loads while your PC is on Wi-Fi, the traffic went out to Cloudflare and came back. ✅
2. **A different network/device.** Send the link to a classmate or open it on a library PC.
3. **A different protocol/port.** `https://` must work (Cloudflare terminates TLS). Confirm there is a
   padlock in the address bar.
4. **From the PC itself** (checks headers, proves HTTPS is real):

   ```powershell
   $url = "https://amber-lion-creek-bravo.trycloudflare.com"     # ← your URL
   curl.exe -I $url
   curl.exe -s -o NUL -w "status=%{http_code} time=%{time_total}s`n" $url
   ```

   Expected: `HTTP/2 200`, `server: cloudflare`, `cf-ray: …`, and `x-content-type-options: nosniff`
   (that last one comes from our `nginx/default.conf`).

   > In PowerShell, `curl` alone is an alias for `Invoke-WebRequest`. Type **`curl.exe`** to get the
   > real curl that ships with Windows 10.

5. **Check the demo really works from outside:** open the public URL on the phone, scroll to
   **Live Demo**, pick a few skills, tap **Find My Matches**, then **Save** one opportunity and refresh
   the page — the saved item should still be there (that is `localStorage` in `app.js` working through
   the tunnel).

✅ *Checkpoint:* the page loads over `https://` from a device on another network, and the interactive
demo works there too.

---

## Part 6 — Day-to-day: start, stop, update

### Start / stop the whole thing

```powershell
cd $HOME\Documents\AI-Project

docker compose --profile quick up -d --build   # start site + public URL (Option A)
docker compose --profile named up -d --build   # start site + your domain (Option B)
docker compose up -d --build                   # start local site only
docker compose down                            # stop everything (URL goes offline)
docker compose ps                              # status of all containers
docker compose logs -f --tail 50               # tail all logs
```

### Make the public URL survive a reboot

1. Docker Desktop → **Settings → General → ✅ Start Docker Desktop when you sign in**.
2. Keep `restart: unless-stopped` in `docker-compose.yml` (already set) — containers come back on their
   own after Docker Desktop starts.
3. Windows 10 must actually be logged in (not just at the lock screen) for Docker Desktop to run.
4. **Disable sleep / hibernate while demoing:** Settings → System → Power & sleep → *Sleep: Never*
   (at least for the 30 minutes around your review). A sleeping laptop = a dead URL.

### Updating the website and republishing

* **You edited `website/index.html` / `styles.css` / `app.js`:** just rebuild — the files are copied
  into the image at build time.

  ```powershell
  docker compose --profile quick up -d --build
  ```

  Then hard-refresh the browser (`Ctrl+F5`) — `index.html` is served with `Cache-Control: no-cache`, so
  a normal refresh is usually enough.

* **You edited `nginx/default.conf` or the `Dockerfile`:** same command; Docker rebuilds only the
  changed layers.

* **New commits on GitHub** (if you cloned with Git):

  ```powershell
  git pull
  docker compose --profile quick up -d --build
  ```

* **You changed `docker-compose.yml`** (ports, services): `docker compose up -d --build --force-recreate`.

* **Named tunnel only:** the token and the public hostname live in Cloudflare, so redeploying the site
  does **not** change your URL. Nothing extra to do.

### Keep an eye on things

```powershell
docker compose ps               # is "web" healthy and the tunnel "Up"?
docker stats --no-stream        # CPU / RAM usage (this stack is tiny: <50 MB idle)
docker image ls                 # images on disk
docker system df                # how much disk Docker uses
docker system prune -af         # reclaim space (removes unused images/cache; safe here)
```

### Uninstall / clean up completely

```powershell
docker compose --profile quick --profile named down --rmi local -v   # our containers + image
# then: Settings → Apps → Docker Desktop → Uninstall
# and optionally in PowerShell:
wsl --unregister docker-desktop        # removes the WSL distro + its virtual disk
```

Also delete the tunnel in the Zero Trust dashboard if you created one, so the token cannot be reused.

---

## Troubleshooting

### A. Docker installation / start-up

| Symptom | Cause | Fix |
|---|---|---|
| Installer says *"Docker Desktop requires Windows 10 22H2 (build 19045) or newer"* | Your build is too old | Update Windows (Part 1 step 3) or use [Appendix B](#appendix-b--if-docker-desktop-will-not-install) |
| `docker` is not recognised in PowerShell | Docker Desktop is not running, or the shell was opened before install | Start Docker Desktop from the Start menu, wait for the tray icon to settle, open a **new** PowerShell window |
| `error during connect: … open //./pipe/dockerDesktopLinuxEngine` | The Docker engine (WSL 2 backend) is not up yet | Start Docker Desktop; wait until the whale icon stops animating; retry |
| `WSL 2 installation is incomplete` / error `0x800701bc` | Old WSL kernel | 🛑 `wsl --update` (or install the MSI from the WSL releases page), then restart Docker Desktop |
| Error `0x80370102` — *"virtual machine could not be started"* | Virtualization disabled in BIOS, or a conflicting hypervisor | Enable VT-x/AMD-V in BIOS; disable Hyper-V/Windows Sandbox/Virtual Machine Platform conflicts; reboot |
| *"Hardware assisted virtualization and data execution protection must be enabled"* | Same as above | Same fix |
| Setup fails on a **Windows 10 Home** PC | Some features need Pro | Home is fine for *Linux* containers via WSL 2 — make sure WSL 2 is installed and selected. Windows/*Windows* containers need Pro |
| Docker Desktop starts but is stuck on *"Docker Engine starting…"* | WSL 2 backend issue | 🛑 `wsl --shutdown`, then restart Docker Desktop; check Docker Desktop → Troubleshoot → Restart |
| Everything is extremely slow | Project folder on a OneDrive/network drive | Move the project to a local `C:` folder and rebuild |
| Corporate/college proxy blocks image pulls | Docker cannot reach Docker Hub | Settings → Resources → Proxies → set your proxy, or use mobile hotspot once to pull the images |

Collect diagnostics for any of the above: **Docker Desktop → Troubleshoot → 🐞 → "Diagnose & feedback"**.

### B. Containers

| Symptom | Cause | Fix |
|---|---|---|
| `port is already allocated` / *bind for 0.0.0.0:8080 failed* | Another program (or an earlier run) holds port 8080 | Find it: `Get-NetTCPConnection -LocalPort 8080 -State Listen` → stop it, or set `WEB_PORT=8090` in `.env` and re-run `docker compose up -d --build` |
| `docker compose up` fails: *"no configuration file provided"* | Wrong folder | `cd` into the folder containing `docker-compose.yml` (`Get-ChildItem docker-compose.yml` to confirm) |
| `Cannot connect to the Docker daemon` | Docker Desktop not running | Start Docker Desktop, wait, retry |
| `web` container restarts in a loop | Bad `nginx/default.conf` | `docker compose logs web`. The `Dockerfile` runs `nginx -t` at build time, so an invalid config should have failed the **build** instead — rebuild and read the error |
| Local site shows nginx **404** | `website/` files not copied | `docker compose exec web ls -l /usr/share/nginx/html` should list `index.html`, `styles.css`, `app.js`; if empty, verify the folder layout and `docker compose up -d --build` again |
| Page loads but is unstyled / demo buttons do nothing | `styles.css` / `app.js` returned 404 | Open DevTools (`F12`) → Console/Network. Fix by rebuilding; the files must be inside `website/` |
| Fonts look different from the screenshots | Google Fonts blocked by your network | Cosmetic only — the site falls back to Inter/system fonts. Fine on the public URL |

### C. Cloudflare tunnel

| Symptom | Cause | Fix |
|---|---|---|
| `docker compose logs cloudflared-quick` shows no `trycloudflare.com` URL | Tunnel still starting, or it crashed | Wait 10–20 s; then check for errors. On a restrictive network try HTTP/2 instead of QUIC: add `--protocol http2` to the service's `command` |
| URL appears but the site never loads (503 / long spinner) | Wrong origin, or `web` not healthy | Local `http://localhost:8080` must work **first**. Then confirm the quick tunnel URL is `http://web:80` (service name) and not `localhost` |
| **Error 1033** (Cloudflare Tunnel error) | No tunnel is connected to that hostname | Container stopped/sleeping → `docker compose ps`, `docker compose --profile <name> up -d`, check the tunnel shows **Healthy** in the dashboard |
| **Error 502 / Bad gateway** | Tunnel is up but the origin is unreachable | Origin must be `web:80` (type `HTTP`). Check `docker compose ps` shows `web` as healthy |
| Quick tunnel returns **429** | 200 concurrent-request limit hit | Normal for quick tunnels; use a named tunnel for real traffic |
| Named tunnel is *Down/Degraded* in the dashboard | Invalid/expired token, or no outbound access | Re-copy the token into `.env`, `docker compose --profile named up -d --force-recreate`; ensure 443 (and ideally 7844/UDP) outbound is allowed |
| Token accidentally pasted somewhere public | It can publish your services | Zero Trust → your tunnel → **Delete/refresh** the token, update `.env`, restart |
| Tunnel works, then dies after a while | Laptop slept / changed network / Docker Desktop closed | Disable sleep while demoing; keep Docker Desktop running; the tunnel reconnects automatically once the container restarts |
| `curl.exe` from another PC shows a Cloudflare page instead of your site | Wrong hostname, or a Cloudflare Access policy is asking for login | Re-check the Public Hostname entry; disable the Access application while testing |
| Everything is fine on your PC but nobody else can reach it | You shared `http://localhost:8080` instead of the `https://…trycloudflare.com` link | Share the public URL — `localhost` always means "this computer" for whoever opens it |

Useful log commands:

```powershell
docker compose logs cloudflared-quick        # quick tunnel: URL + connection status
docker compose logs cloudflared-named        # named tunnel: "Registered tunnel connection"
docker compose logs -f --tail 100            # everything, live
docker compose exec web cat /var/log/nginx/error.log
```

---

## Security notes

This project is a **static** site: HTML, CSS and JavaScript with no server-side code, no database and no
secrets — which is the safest possible thing to expose. Even so:

1. **A public URL is public.** Anyone with the link can read the page, and search engines may index it
   (add a Cloudflare Access policy if that matters — see 4.5).
2. **The `.env` file holds your tunnel token.** It is listed in `.gitignore`, so `git status` never shows
   it and it is never pushed. Never paste the token into a screenshot, chat, README or issue. If you
   think it leaked, delete/rotate the tunnel in the dashboard and paste the new token.
3. **Never expose the Docker socket** (`/var/run/docker.sock`) to the `cloudflared` container — it would
   grant full control of your Docker host. This compose file does not mount it.
4. **Do not publish a public hostname for Docker Desktop's own ports** (2375, 2376) or for anything else
   running on your PC. Only the `web` container is reachable, and only through the tunnel.
5. **HTTPS is automatic.** Cloudflare terminates TLS at the edge; there is no certificate on your laptop
   to manage, and `http://` requests to the public hostname are redirected to `https://`.
6. **Keep Docker Desktop and Windows updated** — the containers themselves are throwaway, but the host
   is not.
7. **Free tier goodies once your domain is on Cloudflare:** Web Application Firewall rules, rate
   limiting, bot fight mode, caching rules, analytics — all configurable in the dashboard, none required
   for this project.
8. **Review demo tip:** a quick tunnel is ideal for a 10-minute presentation, but create the URL
   *before* you start presenting, keep the laptop plugged in, turn sleep off, and (nice touch) put the
   URL in a QR code so the professor can open it on their own phone.

---

## Appendix A — No-Docker fallback (plain Windows)

If you only need the public URL and Docker is giving you trouble, the tunnel part works exactly the
same without Docker. You still need `cloudflared` (a single `.exe`) and any static web server.

```powershell
# 1. Download cloudflared (Cloudflare's own binary)
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$HOME\cloudflared.exe"

# 2. Serve the website from the project folder (Python 3 — install from python.org if missing)
cd $HOME\Documents\AI-Project\website
python -m http.server 8080

# 3. In a SECOND PowerShell window, publish it
& "$HOME\cloudflared.exe" tunnel --url http://localhost:8080
```

`cloudflared` prints the same `https://…trycloudflare.com` URL. Notes:

* Keep **both** windows open — closing either one kills the site.
* `python -m http.server` is for demos only (no caching, no gzip). Any of these also work: Node's
  `npx serve -l 8080`, VS Code's **Live Server** extension, or double-clicking `index.html` and skipping
  the server for *local* viewing only (a tunnel needs a real HTTP server).
* The official binary lives at
  <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/>.

---

## Appendix B — If Docker Desktop will not install

### B1. Recommended: Docker Engine *inside* WSL 2 (no Docker Desktop)

This works on Windows 10 21H2/22H2 without the Docker Desktop requirements, and is what many developers
use on older machines. 🛑 Open PowerShell **as administrator**:

```powershell
wsl --install -d Ubuntu        # install WSL 2 + Ubuntu (restart if asked)
wsl --set-default-version 2
wsl -d Ubuntu                  # enter the Linux shell
```

Inside Ubuntu (the prompt changes to something like `you@pc:~$`):

```bash
# 1. Install Docker Engine using Docker's official convenience script
curl -fsSL https://get.docker.com | sudo sh

# 2. Start it and let it start automatically
sudo service docker start

# 3. Check
docker version && docker compose version

# 4. Project files: Windows drives are mounted under /mnt/c
cd /mnt/c/Users/<your-windows-username>/Documents/AI-Project

# 5. Run the same stack as in Part 3/4
sudo docker compose up -d --build
sudo docker compose logs cloudflared-quick      # → the public URL
```

Caveats: you must run `docker` with `sudo` (or add yourself to the docker group), you must start the
service after each reboot (`sudo service docker start`), and Docker Desktop's tray UI is obviously not
available. Everything else — the site, the tunnel, the URL — is identical.

### B2. Not recommended: an older Docker Desktop

According to Docker's release notes, support for Windows 10 **21H2 (build 19044)** ended with Docker
Desktop **4.49.0** (23 Oct 2025), and later releases refuse to install on it, so an older release such as
**4.49.x or below** is the only way onto a 21H2 machine. Those builds can be downloaded from the
[release notes page](https://docs.docker.com/desktop/release-notes/) (every version has its own download
link), but sticking to an old version is **unsupported, unpatched, and will stop working** — and the old
installer may still refuse to run depending on your build. If B1 does not work for you, prefer **B3**.

### B3. Upgrade or borrow

Upgrade to **Windows 11**, run the project on a newer laptop, or use **Appendix A** (no Docker at all).
For a one-off project review, borrowing a Windows 11 machine for 30 minutes is usually the fastest path.

---

## Appendix C — What each new file does

| File | Key points |
|---|---|
| `Dockerfile` | Base image `nginx:stable-alpine`; copies `nginx/default.conf` over the stock config; copies **only** `website/` into `/usr/share/nginx/html`; runs `nginx -t` at build time so a config typo fails the build; adds a `HEALTHCHECK` hitting `/healthz`; exposes port 80 |
| `nginx/default.conf` | One `server` block on port 80; `server_tokens off`; gzip for text assets; `Cache-Control: no-cache` for `index.html` (so redeploys show instantly) and 1-hour caching for CSS/JS/images; security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`); `try_files` fallback; `/healthz` endpoint |
| `docker-compose.yml` | Project name `campus-agent`; service **`web`** (built locally, published on `${WEB_PORT}:80`, healthcheck); service **`cloudflared-quick`** (profile `quick`, runs `tunnel --no-autoupdate --url http://web:80`); service **`cloudflared-named`** (profile `named`, reads `TUNNEL_TOKEN` from `.env`); one internal bridge network; all containers `restart: unless-stopped`; log rotation capped at 10 MB × 3 |
| `.env.example` | Template: `WEB_PORT` (host port) and `CLOUDFLARE_TUNNEL_TOKEN` (named tunnel only) |
| `.dockerignore` | Keeps `.git`, docs, `.env`, editor folders out of the build context (smaller, faster, no secret leakage) |
| `.gitignore` | Ignores `.env` so your tunnel token is never committed |
| `WINDOWS_DOCKER_CLOUDFLARE_GUIDE.md` | This document |

Nothing in `website/` was modified: the same files work locally, in Docker, and behind the tunnel.

---

## Appendix D — Command cheat-sheet + glossary

### The five commands you will actually use

```powershell
cd $HOME\Documents\AI-Project                  # go to the project
docker compose --profile quick up -d --build   # start site + temporary public URL
docker compose logs cloudflared-quick          # read the public URL
docker compose ps                              # is everything healthy?
docker compose down                            # stop everything
```

### Handy extras

```powershell
docker compose --profile quick up -d --build --force-recreate   # apply compose/nginx changes
docker compose restart web                                      # restart only the site
docker compose exec web sh                                      # shell inside nginx
docker compose exec web nginx -T                                # print the active nginx config
docker system df                                                # disk used by Docker
docker system prune -af                                         # reclaim disk space
wsl --shutdown                                                  # full WSL restart (Docker must be closed)
```

### Glossary

| Term | Meaning |
|---|---|
| **Image** | A read-only template (here: nginx + your website files) |
| **Container** | A running instance of an image — an isolated mini-Linux with its own filesystem and network |
| **Compose / `docker-compose.yml`** | Declarative description of several containers that work together |
| **Profile** | A named group of services that starts only when you pass `--profile <name>` |
| **Service name** (`web`) | The DNS name other containers use to reach a service on the internal Docker network |
| **Port mapping** `"8080:80"` | `host:container` — the port on Windows vs the port inside the container. **Only the host port is needed for `localhost`** |
| **Volume / bind mount** | Persisted or shared storage between host and container (this project needs none — the site is copied in at build time) |
| **`cloudflared`** | Cloudflare's tunnel daemon: creates the outbound connection and forwards public traffic to your container |
| **Quick Tunnel** | Free, account-less, random `trycloudflare.com` URL — for testing/demos |
| **Named Tunnel** | Persistent tunnel you create in the Zero Trust dashboard, published on your own domain |
| **Origin** | The private address Cloudflare forwards to — here `http://web:80` |
| **WSL 2** | Windows Subsystem for Linux 2, the lightweight Linux VM that runs Linux containers on Windows |

---

## Appendix E — References

**Docker**

* Install Docker Desktop on Windows (requirements, installer flags, WSL verification):
  <https://docs.docker.com/desktop/setup/install/windows-install/>
* Docker Desktop release notes (version history / Windows 10 and 11 support notes):
  <https://docs.docker.com/desktop/release-notes/>
* Docker Desktop download: <https://www.docker.com/products/docker-desktop/>
* Docker Desktop subscription (free for personal/education use): <https://www.docker.com/pricing/faq>
* Official nginx image: <https://hub.docker.com/_/nginx>
* Compose file reference (`profiles`, `depends_on`, `healthcheck`, `logging`):
  <https://docs.docker.com/reference/compose-file/>
* Install WSL: <https://learn.microsoft.com/windows/wsl/install>

**Cloudflare**

* `cloudflared` downloads (Windows `.exe`/`.msi`): <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/>
* TryCloudflare — Quick Tunnels (limits: 200 concurrent requests, no SSE):
  <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/>
* Create a remotely-managed tunnel (dashboard + Docker connector, token):
  <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/>
* Cloudflare Zero Trust dashboard: <https://one.dash.cloudflare.com/>
* Cloudflare account sign-up (free): <https://dash.cloudflare.com/sign-up>
* `cloudflared` Docker image: <https://hub.docker.com/r/cloudflare/cloudflared>

**Windows 10 lifecycle**

* Windows 10 release information (end of support 14 October 2025, builds 19044/19045):
  <https://learn.microsoft.com/windows/release-health/release-information>

---

*Guide written for the **AI Campus Opportunity Agent** (Community Engineering Project, BIT42304, IT Dept,
TGPCET Nagpur). Verified against the repository files listed in Appendix C; the website itself
(`website/`) is unchanged and still works standalone with `python3 -m http.server 8080`.*
