import { getApiToken } from "../common/auth.js";
import { handleCommand, outputSuccess } from "../common/output.js";
import { formatDomainUsage } from "../common/usage.js";
import { FileService } from "../services/file-service.js";
export const FILES_META = {
    name: "files",
    summary: "upload/download file attachments",
    context: [
        "files are binary attachments stored in Linear's storage. upload returns",
        "a URL that can be referenced in issue descriptions or comments.",
    ].join("\n"),
    arguments: {
        url: "Linear storage URL",
        file: "local file path",
    },
    seeAlso: [],
};
export function setupFilesCommands(program) {
    const files = program
        .command("files")
        .description("Upload and download files from Linear storage.");
    files.action(() => files.help());
    files
        .command("download <url>")
        .description("download a file from Linear storage")
        .option("--output <path>", "output file path")
        .option("--overwrite", "overwrite existing file", false)
        .action(handleCommand(async (...args) => {
        const [url, options, command] = args;
        const apiToken = getApiToken(command.parent.parent.opts());
        const fileService = new FileService(apiToken);
        const result = await fileService.downloadFile(url, {
            output: options.output,
            overwrite: options.overwrite,
        });
        if (!result.success) {
            throw new Error(result.error || "Download failed");
        }
        outputSuccess({
            filePath: result.filePath,
            message: `File downloaded successfully to ${result.filePath}`,
        });
    }));
    files
        .command("upload <file>")
        .description("upload a file to Linear storage")
        .action(handleCommand(async (...args) => {
        const [filePath, , command] = args;
        const apiToken = getApiToken(command.parent.parent.opts());
        const fileService = new FileService(apiToken);
        const result = await fileService.uploadFile(filePath);
        if (!result.success) {
            throw new Error(result.error || "Upload failed");
        }
        outputSuccess({
            assetUrl: result.assetUrl,
            filename: result.filename,
            message: `File uploaded successfully: ${result.assetUrl}`,
        });
    }));
    files
        .command("usage")
        .description("show detailed usage for files")
        .action(() => {
        console.log(formatDomainUsage(files, FILES_META));
    });
}
