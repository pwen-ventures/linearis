export function isRetryable(error) {
    const err = error;
    const status = err?.response?.status;
    if (typeof status === "number") {
        return status === 429 || (status >= 500 && status < 600);
    }
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        return (msg.includes("timed out") ||
            msg.includes("econnreset") ||
            msg.includes("network"));
    }
    return false;
}
export async function withRetry(fn, options) {
    const { maxRetries = 3, baseDelayMs = 500 } = options ?? {};
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === maxRetries || !isRetryable(error))
                throw error;
            const delay = baseDelayMs * 2 ** attempt;
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw new Error("withRetry: exhausted attempts");
}
