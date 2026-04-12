# Easy Analytics

A super minimalist, lite & easy, independent analytics tracker & visualizer for your custom web applications.

Easy Analytics consists of three parts that work seamlessly together:
1. **Client**: A lightweight browser script (~6 KB uncompressed, ~1.7 KB gzipped) tracking basic metrics (screens, duration, referrers, devices) without relying exclusively on tracking cookies.
2. **Server**: Server-side integration storing the incoming logs effortlessly using `easy-db-node`.
3. **React**: Helpful hooks and a minimalist unstyled UI component (`GroupTable`) for you to build your own dashboard quickly.

## Philosophy

- **Self-hosted**: Say goodbye to ad-blockers preventing analytics. The requests go straight to your backend.
- **Privacy-first**: It groups users into temporary `sessionId` and permanent `localId` via `localStorage`/`sessionStorage` without obnoxious 3rd party tracker tracking.
- **Minimalist setup**: No bloated dashboard or configuration pages unless you create them.

---

## 1. Client Integration

Call `init` as early as possible in your application lifecycle (for example in your main React `index.tsx`, or inside `<script>` tag).

```ts
import { init, sendError } from "easy-analytics/client";

// Initializes the tracker. 
// 1st arg: path to the tracking endpoint
// 2nd arg: token (optional)
init("/api/easy-analytics", "token");

// Example of manual error tracking
try {
    throw new Error("Something broke!");
} catch (e) {
    sendError(e);
}
```

## 2. Server Integration

You need a runtime (like `express.js`) to capture incoming events. Easy Analytics uses `easy-db-node` under the hood.

```ts
import express from "express";
import { postEasyAnalytics, getEasyAnalytics, getEasyAnalyticsError } from "easy-analytics/server";

const app = express();
app.use(express.json()); // Need to parse JSON body

app.post("/api/easy-analytics", async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || "";
        
        // Pass body, userAgent, and IP. Optionally pass ipCountry if you resolve it
        const responseData = await postEasyAnalytics(req.body, userAgent, ip, "US");
        res.status(200).send(responseData);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// Endpoint to retrieve data for your React dashboard
app.get("/api/easy-analytics-data", async (req, res) => {
    // get records by passing month in YYYY-MM format
    const records = await getEasyAnalytics("2026-04");
    res.status(200).send(records);
});
```

This will automatically track page visits, `visibilitychange` for session lengths, and handle basic errors automatically attaching to `window.onerror`.

## 3. Visualization & React Hooks

When it's time to analyze your data in an admin dashboard, `easy-analytics/react` provides utility hooks to process and group rows easily.

The `<GroupTable />` component is 100% dependency-free and uses standard HTML tables.

```tsx
import React, { useEffect, useState } from "react";
import { useGroup, GroupTable, getGroupedCount } from "easy-analytics/react";

export function Dashboard() {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        fetch("/api/easy-analytics-data")
            .then(res => res.json())
            .then(data => setRecords(data));
    }, []);

    // Grouping examples
    // 1. Group by pathname
    const byURL = useGroup(records, r => new URL(r.url).pathname);
    
    // 2. Group by Referrer but count unique users (localId) instead of pure views
    const byReferrer = useGroup(
        records, 
        r => r.referrer || "Direct", 
        rs => getGroupedCount(rs, row => row.localId)
    );

    return (
        <div>
            <h1>Analytics Dashboard</h1>
            
            <div style={{ display: "flex", gap: "20px" }}>
                <GroupTable title="Most Visited Pages" data={byURL} mainColor="#4287f5" />
                <GroupTable title="Traffic Sources (Unique)" data={byReferrer} mainColor="#7dd421" />
            </div>
        </div>
    );
}
```
