# NVH Test Docker Server Deployment

This package is a server-ready Docker deployment bundle for NVH Test.

## 1. Upload

Upload this folder or the zip archive to your server, for example:

```bash
/opt/nvhtest
```

If you uploaded the zip:

```bash
unzip nvhtest-docker-*.zip
cd nvhtest-docker-*
```

## 2. Requirements

- Docker Engine
- Docker Compose v2
- At least 1 GB RAM for only `web` + `forum-preview`
- More memory if enabling the API profile with PostgreSQL and Redis

## 3. Environment

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` only on the server. Do not commit real secrets.

## 4. Start Public Web and Forum Preview

```bash
docker compose up -d web forum-preview
```

Default ports:

- `web`: `http://SERVER_IP:8080`
- `forum-preview`: `http://SERVER_IP:8081`

## 5. Start Mock API Services

The API services are placeholders for architecture verification only.

```bash
docker compose --profile api up -d
```

Default ports:

- Professional API: `http://SERVER_IP:8082/health`
- General AI API gateway: `http://SERVER_IP:8083/health`

## 6. Production Notes

- Point `www.nvhtest.cn` to the `web` service through Nginx, Caddy, Traefik, or Cloudflare Tunnel.
- Point `forum.nvhtest.cn` to an official Discourse deployment. The included `forum-preview` is only a static preparation page.
- Keep `api.nvhtest.cn` and `ai-api.nvhtest.cn` separate. Do not share databases, keys, billing, logs, or user data.

## 7. Useful Commands

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f forum-preview
docker compose down
docker compose --profile api down
```
