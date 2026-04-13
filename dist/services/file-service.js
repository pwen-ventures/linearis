import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";
import { print } from "graphql";
import { extractFilenameFromUrl, isLinearUploadUrl, } from "../common/embed-parser.js";
import { FileUploadDocument } from "../gql/graphql.js";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".ts": "application/typescript",
    ".md": "text/markdown",
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
};
function getMimeType(filePath) {
    const ext = extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || "application/octet-stream";
}
export class FileService {
    apiToken;
    constructor(apiToken) {
        this.apiToken = apiToken;
    }
    async downloadFile(url, options = {}) {
        if (!isLinearUploadUrl(url)) {
            return {
                success: false,
                error: "URL must be from uploads.linear.app domain",
            };
        }
        const outputPath = options.output || extractFilenameFromUrl(url);
        if (!options.overwrite) {
            try {
                await access(outputPath);
                return {
                    success: false,
                    error: `File already exists: ${outputPath}. Use --overwrite to replace.`,
                };
            }
            catch {
            }
        }
        try {
            const urlObj = new URL(url);
            const isSignedUrl = urlObj.searchParams.has("signature");
            const headers = {};
            if (!isSignedUrl) {
                headers.Authorization = `Bearer ${this.apiToken}`;
            }
            const response = await fetch(url, {
                method: "GET",
                headers,
                signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    statusCode: response.status,
                };
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const outputDir = dirname(outputPath);
            if (outputDir !== ".") {
                await mkdir(outputDir, { recursive: true });
            }
            await writeFile(outputPath, buffer);
            return {
                success: true,
                filePath: outputPath,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async uploadFile(filePath) {
        const filename = basename(filePath);
        try {
            await access(filePath);
        }
        catch {
            return {
                success: false,
                error: `File not found: ${filePath}`,
            };
        }
        let fileSize;
        try {
            const fileStat = await stat(filePath);
            fileSize = fileStat.size;
        }
        catch (error) {
            return {
                success: false,
                error: `Cannot read file: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
        if (fileSize > MAX_FILE_SIZE) {
            const maxMB = MAX_FILE_SIZE / (1024 * 1024);
            const actualMB = fileSize / (1024 * 1024);
            return {
                success: false,
                error: `File too large: ${actualMB.toFixed(1)}MB exceeds limit of ${maxMB}MB`,
            };
        }
        const contentType = getMimeType(filePath);
        try {
            const graphqlResponse = await fetch("https://api.linear.app/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.apiToken,
                },
                body: JSON.stringify({
                    query: print(FileUploadDocument),
                    variables: {
                        contentType,
                        filename,
                        size: fileSize,
                    },
                }),
                signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
            });
            if (!graphqlResponse.ok) {
                return {
                    success: false,
                    error: `GraphQL request failed: HTTP ${graphqlResponse.status}`,
                    statusCode: graphqlResponse.status,
                };
            }
            const data = await graphqlResponse.json();
            if (data.errors) {
                const errorMsg = data.errors[0]?.message || "GraphQL error";
                return {
                    success: false,
                    error: `Failed to request upload URL: ${errorMsg}`,
                };
            }
            const fileUpload = data.data?.fileUpload;
            if (!fileUpload?.success) {
                return {
                    success: false,
                    error: "Failed to request upload URL: success=false",
                };
            }
            const uploadFile = fileUpload.uploadFile;
            const uploadUrl = uploadFile?.uploadUrl;
            const assetUrl = uploadFile?.assetUrl;
            const headersList = uploadFile?.headers || [];
            if (!uploadUrl || !assetUrl) {
                return {
                    success: false,
                    error: "Missing uploadUrl or assetUrl in response",
                };
            }
            const fileBuffer = await readFile(filePath);
            const fileContent = new Uint8Array(fileBuffer);
            const putHeaders = {
                "Content-Type": contentType,
            };
            for (const header of headersList) {
                putHeaders[header.key] = header.value;
            }
            const putResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: putHeaders,
                body: fileContent,
                signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
            });
            if (!putResponse.ok) {
                return {
                    success: false,
                    error: `File upload failed: HTTP ${putResponse.status}`,
                    statusCode: putResponse.status,
                };
            }
            return {
                success: true,
                assetUrl,
                filename,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
