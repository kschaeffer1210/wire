# WIRE — Workflow Intelligence & ROI Engine

AI-powered workflow analyzer and project hub. Reads and writes directly to a Notion database.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- @notionhq/client
- @anthropic-ai/sdk (server-side only)

## Setup

### 1. Environment Variables

Edit `.env.local` and fill in your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=e52ece1438454ab497297e95b1609ab0
```

**Notion integration setup:**
1. Go to notion.so/my-integrations → create a new integration
2. Copy the "Internal Integration Secret" as `NOTION_TOKEN`
3. Open your Notion database → ··· menu → **Add connections** → select your integration
4. The `NOTION_DATABASE_ID` is already set to your existing database

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy on Mac Mini (PM2 — persistent background process)

### Install PM2

```bash
npm install -g pm2
```

### Build for production

```bash
npm run build
```

### Start with PM2

```bash
pm2 start npm --name "wire" -- start
```

### Make it survive reboots

```bash
pm2 save
pm2 startup
# Run the command it prints (looks like: sudo env PATH=... pm2 startup launchd -u ... --hp ...)
```

### Useful PM2 commands

```bash
pm2 status          # check if running
pm2 logs wire       # tail logs
pm2 restart wire    # restart after code changes
pm2 stop wire       # stop
pm2 delete wire     # remove from PM2
```

### Rebuild + restart after changes

```bash
npm run build && pm2 restart wire
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Workflow intake form |
| `/results/[id]` | Full analysis results (Notion page ID) |
| `/projects` | Project hub — filterable table/card view |
| `/api/analyze` | POST — runs Claude analysis, writes to Notion |
| `/api/projects` | GET — reads all records from Notion |

## Notes

- Analysis uses `claude-sonnet-4-20250514`
- ROI formula: `hours_saved_week = time_per_run × runs_per_week × (time_reduction_pct / 100)`, then `× 48 weeks` for annual, `× hourly_rate` for dollar value
- All AI calls are server-side only (API keys never exposed to client)
