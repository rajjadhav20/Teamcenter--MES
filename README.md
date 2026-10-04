# Teamcenter → MES Ingestion Bridge

A production-ready MERN data ingestion pipeline and real-time monitoring dashboard that moves PLM records from **Teamcenter** into **MES**, through three source adapters (Direct API, a simulated network folder watcher, and a mocked Google Drive), a format-agnostic parsing layer, and an in-process async queue — all visible live on an andon-board-style dashboard.

```
Teamcenter (PLM)                         MES
      │                                    ▲
      │  JSON / XML / XLSX / CSV           │  unified IngestionPayload
      ▼                                    │
┌───────────────────────────────────────────────────┐
│  OP-10        OP-20        OP-30         OP-40     │
│  RECEIVE  →   PARSE    →  VALIDATE/  →  LOAD TO    │
│                            TRANSFORM      MES      │
└───────────────────────────────────────────────────┘
      ▲               ▲                ▲
   Direct API    Folder Watcher   Google Drive
   POST           (simulated       (mocked)
                   upload)
```

Every batch is a `PipelineRun` that moves through those four routing-style operations, broadcasting its status over Socket.io the whole way, so the dashboard updates without polling.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 (Vite 6), Tailwind CSS v4 (CSS-first config), lucide-react, Axios, socket.io-client |
| Backend | Node.js, Express 5, Socket.io |
| Database | MongoDB via Mongoose (`PipelineRun`, `IngestionLog`, `IngestionPayload`) |
| Parsing | `multer` (uploads), `csv-parser`, `xlsx` (SheetJS), `xml2js` |
| Queue | A small in-process `EventEmitter`-based queue — no Redis/BullMQ (see [Why no Redis?](#why-no-redis)) |

## Project structure

```
teamcenter-mes-pipeline/
├── server/
│   ├── server.js              # entry point: connects DB, attaches Socket.io, listens
│   ├── app.js                 # Express app construction (kept separate for testability)
│   ├── config/                # constants.js (enums), db.js
│   ├── models/                # PipelineRun, IngestionLog, IngestionPayload
│   ├── parsers/                # jsonParser, xmlParser, xlsxParser, csvParser + router
│   ├── services/               # ingestionService (the pipeline), transform/validation,
│   │                           #   pipelineQueue, socketService, googleDriveMockService,
│   │                           #   folderWatcherService, dashboardService, auditLogService
│   ├── controllers/            # ingestion / pipeline / dashboard HTTP handlers
│   ├── routes/                 # /api/v1/ingest, /api/v1/pipeline, /api/v1/dashboard
│   ├── middleware/              # uploadMiddleware (multer), errorHandler, notFound
│   ├── seed/sampleData.js       # populates demo runs across every source/format/outcome
│   └── watched-folder/          # optional real folder-watch target (see .env)
└── client/
    └── src/
        ├── api/                # axiosClient, socketClient
        ├── hooks/               # useDashboardData (REST + live socket state), useSocket
        ├── components/
        │   ├── layout/Header.jsx
        │   └── dashboard/       # StatCard(Grid), IngestPanel, PipelineLogTable,
        │                        #   StatusBadge, ProgressBar, StageStepper,
        │                        #   RunDetailDrawer, ActivityFeed
        └── utils/                # constants.js, formatters.js
```

## Setup

**Prerequisites:** Node.js 20+, a running MongoDB (local or Atlas).

```bash
# 1. Backend
cd server
cp .env.example .env      # edit MONGO_URI if not using the default local instance
npm install
npm run dev                # starts on http://localhost:5000

# 2. Frontend (separate terminal)
cd client
cp .env.example .env      # defaults to http://localhost:5000, adjust if needed
npm install
npm run dev                # starts on http://localhost:5173

# 3. Optional: seed a few demo batches so the dashboard isn't empty on first load
cd server
npm run seed
```

A root `package.json` is also included with `npm run install:all` and `npm run dev` (via `concurrently`) if you'd rather drive both from one terminal at the repo root.

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/ingest` | Direct API adapter — JSON body or multipart file (field `file`) |
| `POST` | `/api/v1/ingest/folder-watcher` | Simulated folder-watcher pickup — multipart file |
| `GET` | `/api/v1/ingest/google-drive-mock/files` | List the mocked Drive folder's files |
| `POST` | `/api/v1/ingest/google-drive-mock` | Sync one (`{ "fileId": "..." }`) or all mocked files |
| `GET` | `/api/v1/pipeline/runs` | List runs — filter by `status`, `source`, `format`; paginated |
| `GET` | `/api/v1/pipeline/runs/:id` | Single run detail |
| `GET` | `/api/v1/pipeline/runs/:id/logs` | Audit log for one run |
| `GET` | `/api/v1/pipeline/runs/:id/payloads` | Loaded `IngestionPayload` records for one run |
| `GET` | `/api/v1/dashboard/stats` | Total Transferred / Active Jobs / Failed Batches / Success Rate |
| `GET` | `/health` | Liveness check |

Accepted file extensions: `.json`, `.xml`, `.csv`, `.xlsx`, `.xls` (15 MB default limit, configurable via `MAX_UPLOAD_MB`).

## Socket.io events

Broadcast by the server, consumed by `useDashboardData`:

| Event | Payload | When |
|---|---|---|
| `pipeline:new` | `PipelineRun` | A batch is accepted (status `PENDING`) |
| `pipeline:update` | `PipelineRun` | Status/stage/progress changes as the queue processes it |
| `log:new` | `IngestionLog` | A new audit log line is written for any run |
| `stats:update` | dashboard stats | After every run completes |

## Production decisions worth knowing about

### The `xlsx` (SheetJS) dependency
The `xlsx` package on the public npm registry is frozen at `0.18.5`, which has known high-severity prototype-pollution and ReDoS advisories with **no fix published to npm** — SheetJS moved distribution of patched releases to their own CDN. `server/package.json` therefore points `xlsx` at `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` instead of a version range; it installs and imports as the same `xlsx` package either way. `xlsxParser.js` also strips `__proto__`/`constructor`/`prototype`-named columns at the parser boundary as defense in depth. If your environment can't reach the SheetJS CDN, vendoring the tarball or switching to `exceljs` are the documented alternatives.

### Multer 2.x
Multer 1.x has multiple DoS advisories (memory leak on stream error, crash on malformed multipart requests). `package.json` pins `multer@^2.1.1`, the first fully patched line. The `single`/`array`/`fields` API is unchanged from 1.x; only the error-handling internals differ, which `middleware/errorHandler.js` accounts for.

### Why no Redis? {#why-no-redis}
`services/pipelineQueue.js` is a deliberately small in-process queue (concurrency-limited, EventEmitter-based). This app runs as one Node process and doesn't need to survive a restart mid-batch or scale across workers — a Redis-backed queue like BullMQ would be infrastructure the project doesn't need yet. `pipelineQueue.enqueue(job)` is the one call site that would change if that ever stops being true.

### Express 5
Route handlers are plain `async (req, res) => {...}` functions with no `try/catch` or `asyncHandler` wrapper — Express 5 forwards a thrown error or rejected promise from any async handler straight to `middleware/errorHandler.js` automatically. `app.js` and `server.js` are split specifically so the Express app can be constructed and tested without connecting to Mongo or calling `listen()`.

### Tailwind CSS v4
There's no `tailwind.config.js`. `client/src/index.css` uses the v4 CSS-first `@theme` block to define the entire design system — the andon status colors, the industrial monospace/sans font stack, and panel/badge radii — directly as CSS custom properties, which Tailwind turns into the full utility set (`bg-andon-processing`, `font-mono-industrial`, `rounded-panel`, etc.) automatically. `vite.config.js` uses the official `@tailwindcss/vite` plugin, so there's no separate PostCSS config either.

### Design direction
The dashboard is styled as a factory-floor andon board rather than a generic SaaS panel: dark control-room base, monospace numerals (the way HMI/SCADA readouts render data), hairline borders instead of drop shadows, and exactly four reserved signal colors for run status. The per-row stage stepper mirrors real routing-sheet notation (`OP-10` → `OP-40`) rather than a generic step indicator.

## Extending the pipeline

- **New source adapter:** add a controller function that resolves `{ source, format, fileName, rawInput }` and calls `ingestionService.submitBatch(...)` — see `googleDriveMockService.js` for the pattern of mocking an external API behind the same interface.
- **New format:** add a `parsers/<format>Parser.js` that returns an array of raw record objects, then register it in `parsers/index.js`'s `parseByFormat` switch and `EXTENSION_TO_FORMAT` in `config/constants.js`.
- **New unified schema field:** add it to `models/IngestionPayload.js`, then add its known aliases to `FIELD_ALIASES` in `services/transformService.js`.
