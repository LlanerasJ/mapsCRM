# MapsCRM

A lightweight CRM for sales teams to map and route company visits. Import your accounts from Excel, plot them on Google Maps, and plan an optimized driving route for the day.

## Features

- **Company management** — add, edit, and delete companies with contact info and notes
- **Excel import** — drag and drop a `.xlsx` or `.csv` file, auto-maps columns, geocodes all addresses
- **Interactive map** — all companies plotted as pins (red = not planned, blue = planned, green = visited)
- **Day planner** — pick a date, check the companies you're visiting, and generate an optimized driving route
- **Visit tracking** — mark stops as visited throughout the day

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Express (Node.js)
- **Storage:** JSON file (`server/crm.json`)
- **Maps:** Google Maps JavaScript API (Geocoding + Directions)

## Local Development

### Prerequisites
- Node.js 18+
- A Google Maps API key with **Maps JavaScript API**, **Geocoding API**, and **Directions API** enabled

### Setup

```bash
# Install all dependencies
npm run setup

# Add your API key
echo "VITE_GOOGLE_MAPS_API_KEY=your_key_here" > client/.env.local

# Start both servers
npm run dev
```

App runs at `http://localhost:5173` — the backend API runs on port 3001.

### Getting a Google Maps API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and go to **APIs & Services → Library**
3. Enable: **Maps JavaScript API**, **Geocoding API**, **Directions API**
4. Go to **Credentials → Create API Key**
5. Paste it into `client/.env.local`

Google provides $200/month in free credits — more than enough for normal CRM usage.

## Deployment (Render + Netlify subdomain)

1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com) connected to your repo
3. Set the environment variable `VITE_GOOGLE_MAPS_API_KEY` in Render's dashboard
4. Render auto-detects `render.yaml` — just hit Deploy
5. In Netlify DNS, add a `CNAME` record: `crm` → `your-app.onrender.com`

## Excel Import Format

Any `.xlsx` or `.csv` file works. Column names are auto-detected — common variations like "Company", "Business Name", "Street", "Location", "Tel", etc. are all recognized. At minimum you need a name column and an address column.

| Company Name | Address | Contact Name | Phone | Email |
|---|---|---|---|---|
| Acme Corp | 123 Main St, Tampa, FL 33601 | Jane Smith | (813) 555-0100 | jane@acme.com |
