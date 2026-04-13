export type UUID = string;

export type AnalysisRecord = {
    recordIdBefore: string,
    localId: UUID,
    sessionId: UUID,
    serverDate: string,
    localDate: string,
    localDateLeft?: string,
    ip: string,
    ipCountry?: string,
    userAgent: string,
    url: string,
    urlBefore: string,
    referrer: string,
    window: {
        innerWidth: number,
        innerHeight: number,
        devicePixelRatio: number,
        screenWidth: number,
        screenHeight: number,
    },
};

export type AnalysisRecordBrowser = Omit<AnalysisRecord, "ip" | "userAgent" | "serverDate" | "localDateLeft">;
export type AnalysisLeaveRecordBrowser = {
    recordIdBefore: string,
    localId: UUID,
    sessionId: UUID,
    localDate: string,
};

export type AnalysisErrorRecord = AnalysisErrorRecordBrowser & {
    serverDate: string,
};

export type AnalysisErrorRecordBrowser = {
    localId: UUID,
    sessionId: UUID,
    url: string,
    localDate: string,
    error: {
        name?: string,
        message: string,
        stack?: string,
    },
};

export function getDate(date = new Date()): string {
    const offset = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const offsetString = (offset > 0 ? '-' : '+') + offsetHours.toFixed(0).padStart(2, '0') + ':' + offsetMinutes.toFixed(0).padStart(2, '0');
    return date.toISOString().replace('Z', offsetString);
}

export function isUuidV4(id: unknown): id is UUID {
    if (
        id
        && typeof id === "string"
        && id.length === 36
        && id.charAt(8) === "-"
        && id.charAt(13) === "-"
        && id.charAt(18) === "-"
        && id.charAt(23) === "-"
        && id.charAt(14) === "4"
    ) return true;

    return false;
}

export function generateUuidV4(): UUID {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}