import easyDBNode from "easy-db-node";

import { AnalysisErrorRecord, AnalysisErrorRecordBrowser, AnalysisLeaveRecordBrowser, AnalysisRecord, AnalysisRecordBrowser, getDate } from "./common";

type Month = string;

const { insert, select, selectArray, update, remove } = easyDBNode<{
    [key: `easyAnalytics-${Month}`]: AnalysisRecord,
    [key: `easyAnalyticsError-${Month}`]: AnalysisErrorRecord,
}>({});

export * from "./common";

export async function postEasyAnalytics(body: unknown, userAgent: string, ip: string, ipCountry?: string) {
    const recordBrowser = getAnalysisRecordBrowser(body);
    if (recordBrowser) {
        const serverDate = getDate();

        if (recordBrowser.recordIdBefore) {
            await updateLeaveRecord(recordBrowser.recordIdBefore, recordBrowser.localDate);
        }

        const id = await insert(getCollection(serverDate), {
            ...recordBrowser,
            ip,
            ipCountry,
            userAgent,
            serverDate,
        });

        return { id };
    }

    const leaveRecordBrowser = getAnalysisLeaveRecordBrowser(body);
    if (leaveRecordBrowser)
        return await updateLeaveRecord(leaveRecordBrowser.recordIdBefore, leaveRecordBrowser.localDate);

    const errorRecordBrowser = getAnalysisErrorRecordBrowser(body);
    if (errorRecordBrowser)
        return {
            id: await insert(getErrorCollection(errorRecordBrowser.localDate), {
                ...errorRecordBrowser,
                serverDate: getDate(),
            })
        };

    throw new Error("Easy Analytics data are not valid");
}

export async function getEasyAnalytics(month: Month) {
    return selectArray(getCollection(month));
}

export async function getEasyAnalyticsError(month: Month) {
    return selectArray(getErrorCollection(month));
}

export async function updateEasyAnalyticsRecord(month: Month, recordId: string, record: AnalysisRecord) {
    await update(getCollection(month), recordId, record);
}

async function updateLeaveRecord(recordIdBefore: string, date: string) {
    const collection = getCollection(date);

    const record = await select(collection, recordIdBefore);
    // TODO: check month back
    if (!record) {
        console.error(new Error("Easy Analytic leave record not found"));
        return { id: recordIdBefore };
    }

    // TODO: check localId and more
    await update(collection, record._id, {
        ...record,
        localDateLeft: date,
    });

    return { id: record._id };
}

function getCollection(date?: string): `easyAnalytics-${Month}` {
    return `easyAnalytics-${getMonth(date)}`;
}

function getErrorCollection(date?: string): `easyAnalyticsError-${Month}` {
    return `easyAnalyticsError-${getMonth(date)}`;
}

function getMonth(date = getDate()): Month {
    return date.slice(0, 7);
}

function getAnalysisLeaveRecordBrowser(d: any): null | AnalysisLeaveRecordBrowser {
    if (
        d !== null
        && typeof d === "object"
        && typeof d.recordIdBefore === "string"
        && typeof d.localId === "string" && d.localId
        && typeof d.sessionId === "string" && d.sessionId
        && typeof d.localDate === "string" && d.localDate
        && typeof d.url === "undefined"
    ) return {
        recordIdBefore: d.recordIdBefore,
        localId: d.localId,
        sessionId: d.sessionId,
        localDate: d.localDate,
    };

    return null;
}

function getAnalysisRecordBrowser(d: any): null | AnalysisRecordBrowser {
    if (
        d !== null
        && typeof d === "object"
        && typeof d.recordIdBefore === "string"
        && typeof d.localId === "string" && d.localId
        && typeof d.sessionId === "string" && d.sessionId
        && typeof d.localDate === "string" && d.localDate
        && typeof d.url === "string" && d.url
        && typeof d.urlBefore === "string"
        && typeof d.referrer === "string"
        && typeof d.window === "object" && d.window
        && typeof d.window.innerWidth === "number"
        && typeof d.window.innerHeight === "number"
        && typeof d.window.devicePixelRatio === "number"
        && typeof d.window.screenWidth === "number"
        && typeof d.window.screenHeight === "number"
    ) return {
        recordIdBefore: d.recordIdBefore,
        localId: d.localId,
        sessionId: d.sessionId,
        localDate: d.localDate,
        url: d.url,
        urlBefore: d.urlBefore,
        referrer: d.referrer,
        window: {
            innerWidth: d.window.innerWidth,
            innerHeight: d.window.innerHeight,
            devicePixelRatio: d.window.devicePixelRatio,
            screenWidth: d.window.screenWidth,
            screenHeight: d.window.screenHeight,
        },
    };

    return null;
}

function getAnalysisErrorRecordBrowser(d: any): null | AnalysisErrorRecordBrowser {
    if (
        d !== null
        && typeof d === "object"
        && typeof d.localId === "string" && d.localId
        && typeof d.sessionId === "string" && d.sessionId
        && typeof d.localDate === "string" && d.localDate
        && typeof d.url === "string"
        && d.error
        && typeof d.error === "object"
        && typeof d.error.message === "string"
        && (typeof d.error.name === "string" || typeof d.error.name === "undefined")
        && (typeof d.error.stack === "string" || typeof d.error.stack === "undefined")
    ) return {
        localId: d.localId,
        sessionId: d.sessionId,
        url: d.url,
        localDate: d.localDate,
        error: {
            name: d.error.name,
            message: d.error.message,
            stack: d.error.stack,
        },
    };

    return null;
}
