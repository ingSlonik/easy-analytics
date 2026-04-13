import React, { useMemo } from "react";

export type GroupLog<T> = {
    key: string;
    records: T[];
    count: number;
};

export function useGroup<T>(log: T[], cb: (l: T) => string, cbCount = (l: T[]) => l.length): GroupLog<T>[] {
    return useMemo(() => {
        // Fallback for environments where Object.groupBy might not be available yet
        const group = (Object as any).groupBy ? (Object as any).groupBy(log, cb) : fallbackGroupBy(log, cb);

        return Object.entries(group)
            .map(([key, records]) => ({ key, records: records as T[] || [], count: cbCount(records as T[] || []) }))
            .sort((a, b) => b.count - a.count);
    }, [log]);
}

function fallbackGroupBy<T>(log: T[], cb: (l: T) => string): Record<string, T[]> {
    const group: Record<string, T[]> = {};
    for (const item of log) {
        const key = cb(item);
        if (!group[key]) group[key] = [];
        group[key].push(item);
    }
    return group;
}

export function getGroupedCount<T>(records: T[], cb: (r: T) => string) {
    const group = (Object as any).groupBy ? (Object as any).groupBy(records, cb) : fallbackGroupBy(records, cb);
    return Object.keys(group).length;
}

export function GroupTable<T>({ title, data, mainColor = "#7dd421" }: { title: string, data: GroupLog<T>[], mainColor?: string }) {
    const max = Math.max(0, ...data.map(d => d.count));
    const sum = data.reduce((a, b) => a + b.count, 0);

    return <div style={{ width: "100%", maxWidth: "600px", marginBottom: "32px", fontFamily: "sans-serif" }}>
        <h2 style={{ paddingTop: "20px", marginBottom: "8px" }}>{title}</h2>
        <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#666" }}>Záznamy: {Object.keys(data).length}</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr>
                    <th style={{ textAlign: "left", paddingBottom: "8px", width: "150px" }}>Počet</th>
                    <th style={{ textAlign: "left", paddingBottom: "8px" }}>Položka</th>
                </tr>
            </thead>
            <tbody>
                {data.map(r => <tr key={r.key}>
                    <td style={{ position: "relative", padding: "4px 0", minWidth: "150px" }}>
                        <div style={{ position: "absolute", zIndex: 1, width: `${max > 0 ? (r.count / max * 100) : 0}%`, left: "0px", top: "4px", bottom: "4px", backgroundColor: mainColor, borderRadius: "4px", opacity: 0.8 }} />
                        <div style={{ position: "relative", zIndex: 2, paddingLeft: "8px", fontWeight: "bold" }}>
                            {r.count} <span style={{ fontWeight: "normal", fontSize: "0.85em", opacity: 0.8 }}>({sum > 0 ? Math.round(r.count / sum * 100) : 0}%)</span>
                        </div>
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "400px" }} title={r.key}>
                            {r.key}
                        </div>
                    </td>
                </tr>)}
            </tbody>
        </table>
    </div>;
}
