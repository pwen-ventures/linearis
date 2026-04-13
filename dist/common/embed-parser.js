function stripCodeContexts(content) {
    let cleaned = content.replace(/\\`/g, "");
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
    cleaned = cleaned.replace(/`[^`]+`/g, "");
    return cleaned;
}
export function extractEmbeds(content) {
    if (!content) {
        return [];
    }
    const cleanedContent = stripCodeContexts(content);
    const embeds = [];
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const patterns = [
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g,
    ];
    for (const regex of patterns) {
        for (const match of cleanedContent.matchAll(regex)) {
            const label = match[1] || "file";
            const url = match[2];
            if (isLinearUploadUrl(url)) {
                embeds.push({ label, url, expiresAt });
            }
        }
    }
    return embeds;
}
export function isLinearUploadUrl(url) {
    if (!url) {
        return false;
    }
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === "uploads.linear.app";
    }
    catch {
        return false;
    }
}
export function extractFilenameFromUrl(url) {
    try {
        const parts = new URL(url).pathname.split("/");
        return parts[parts.length - 1] || "download";
    }
    catch {
        return "download";
    }
}
