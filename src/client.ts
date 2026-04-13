import { AnalysisErrorRecordBrowser, AnalysisLeaveRecordBrowser, AnalysisRecordBrowser, generateUuidV4, getDate, isUuidV4, UUID } from "./common";

export * from "./common";

const STORAGE_ID = "easyAnalyticsId";

let easyAnalyticsUrl = "/api/easy-analytics";
let easyAnalyticsToken = "";

export function init(url = easyAnalyticsUrl, token = easyAnalyticsToken) {
    // not run on server site
    if (typeof window === "undefined" || typeof document === "undefined") return;

    easyAnalyticsUrl = url;
    easyAnalyticsToken = token;

    let interval: null | ReturnType<typeof setInterval> = setInterval(() => handleChangeUrl(url, token), 500);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            if (interval === null)
                interval = setInterval(() => handleChangeUrl(url, token), 500);
        } else {
            // leaving page or tab - can return
            if (interval) {
                handleLeave(url, token);
                clearInterval(interval);
                interval = null;
            }
        }
    });
    window.addEventListener("beforeunload", () => {
        if (interval) handleLeave(url, token);
    });

    // error handle
    // window.onerror = (message, source, lineno, colno, error) => {
    //     handleError(url, token, error || message);
    // };
    window.addEventListener("error", (event) => sendError(event.error, url, token));
    window.addEventListener("unhandledrejection", (event) => sendError(event.reason, url, token));
}

let localId: null | UUID = null;
export function getLocalId(): UUID {
    // not run on server site
    if (typeof localStorage === "undefined") return "server";

    if (localId) return localId;

    localId = localStorage.getItem(STORAGE_ID);
    if (isUuidV4(localId))
        return localId;

    localId = generateUuidV4();
    localStorage.setItem(STORAGE_ID, localId);
    return localId;
}

let sessionId: null | UUID = null;
export function getSessionId(): UUID {
    // not run on server site
    if (typeof sessionStorage === "undefined") return "server";

    if (sessionId) return sessionId;

    sessionId = sessionStorage.getItem(STORAGE_ID);
    if (isUuidV4(sessionId))
        return sessionId;

    sessionId = generateUuidV4();
    sessionStorage.setItem(STORAGE_ID, sessionId);
    return sessionId;
}

let recordIdBefore = "";
let urlBefore = "";
function handleChangeUrl(sendUrl: string, token: string) {
    const url = window.location.href;
    if (url === urlBefore) return;

    const record: AnalysisRecordBrowser = {
        recordIdBefore,
        localId: getLocalId(),
        sessionId: getSessionId(),
        localDate: getDate(),
        url,
        urlBefore,
        referrer: document.referrer,
        window: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
        },
    };
    urlBefore = url;

    fetch(
        sendUrl + (token ? `?token=${encodeURIComponent(token)}` : ""),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
        }
    )
        .then(res => res.json())
        .then(data => {
            if (data && typeof data === "object" && typeof data.id === "string" && data.id) {
                recordIdBefore = data.id;
            } else {
                console.warn("Easy Analytics problem with receiving data to server");
            }
        })
        .catch(() => {
            console.warn("Easy Analytics problem with receiving data to server");
        });
}

function handleLeave(sendUrl: string, token: string) {
    const record: AnalysisLeaveRecordBrowser = {
        recordIdBefore,
        localId: getLocalId(),
        sessionId: getSessionId(),
        localDate: getDate(),
    };

    const send = navigator.sendBeacon(
        sendUrl + (token ? `?token=${encodeURIComponent(token)}` : ""),
        new Blob([JSON.stringify(record)], { type: "application/json" }),
    );

    if (!send) {
        console.warn("Easy Analytics problem with sending data to server");
    }
}

export function sendError(error: any, sendUrl = easyAnalyticsUrl, token = easyAnalyticsToken) {
    let name: undefined | string;
    let message = "";
    let stack: undefined | string;

    if (error instanceof Error) {
        name = error.name;
        message = error.message;
        stack = error.stack;
    } else if (typeof error === "string") {
        message = error;
    } else {
        message = JSON.stringify(error);
    }

    const record: AnalysisErrorRecordBrowser = {
        localId: getLocalId(),
        sessionId: getSessionId(),
        url: window.location.href,
        localDate: getDate(),
        error: { name, message, stack },
    };

    fetch(
        sendUrl + (token ? `?token=${encodeURIComponent(token)}` : ""),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
        }
    )
        .then(res => res.json())
        .then(data => {
            if (!data || typeof data !== "object" || typeof data.id !== "string" && !data.id)
                console.warn("Easy Analytics problem with receiving data to server");
        })
        .catch(() => {
            console.warn("Easy Analytics problem with receiving data to server");
        });
}
