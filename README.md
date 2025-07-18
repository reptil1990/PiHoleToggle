# Pi-hole Toggle

A simple web control panel to enable, disable, and time-control DNS blocking on your Pi-hole instance.

## Features

- Enable/disable Pi-hole DNS blocking via web UI
- Temporarily disable blocking for a set time (timer)
- Status display and countdown for reactivation
- Responsive, mobile-friendly frontend
- Docker support for easy deployment

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- Docker (optional)
- A running Pi-hole instance with API access

### Configuration

Create a `.env` file in the project root:

```
PIHOLE_HOST=https://<your-pihole-ip>
PIHOLE_API_KEY=<your-pihole-api-key>
PIHOLE_API_BASE=/api
```

### Install Dependencies

```sh
npm install
```

### Run Locally

```sh
npm start
```

Visit [http://localhost:8082](http://localhost:8082) in your browser.

### Docker

Build and run with Docker Compose:

```sh
docker-compose up --build
```

## API Endpoints

- `GET /api/status` — Get current blocking status and timer
- `POST /api/enable` — Enable DNS blocking
- `POST /api/disable` — Disable DNS blocking (optionally with `{ "timer": seconds }`)
- `GET /api/health` — Health check

## Frontend

The web UI is served from [`public/index.html`](public/index.html).

## License

MIT

---

Made