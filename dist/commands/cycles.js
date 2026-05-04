import { createContext } from "../common/context.js";
import { invalidParameterError, notFoundError, requiresParameterError, } from "../common/errors.js";
import { handleCommand, outputSuccess, parseLimit } from "../common/output.js";
import { formatDomainUsage } from "../common/usage.js";
import { resolveCycleId } from "../resolvers/cycle-resolver.js";
import { resolveScopedTeamId } from "../common/team-scope.js";
import { getCycle, listCycles } from "../services/cycle-service.js";
export const CYCLES_META = {
    name: "cycles",
    summary: "time-boxed iterations (sprints) per team",
    context: [
        "a cycle is a sprint belonging to one team. each team can have one",
        "active cycle at a time. cycles contain issues and have start/end dates.",
    ].join("\n"),
    arguments: {
        cycle: "cycle identifier (UUID or name)",
    },
    seeAlso: ["issues create --cycle", "issues update --cycle"],
};
export function setupCyclesCommands(program) {
    const cycles = program.command("cycles").description("Cycle operations");
    cycles.action(() => cycles.help());
    cycles
        .command("list")
        .description("list cycles")
        .option("--team <team>", "filter by team (key, name, or UUID)")
        .option("--active", "only show active cycles")
        .option("--window <n>", "active cycle +/- n neighbors (requires --team)")
        .option("-l, --limit <n>", "max results", "50")
        .option("--after <cursor>", "cursor for next page")
        .action(handleCommand(async (...args) => {
        const [options, command] = args;
        if (options.window && !options.team) {
            throw requiresParameterError("--window", "--team");
        }
        if (options.window && options.after) {
            throw invalidParameterError("--after", "cannot be used with --window");
        }
        const ctx = createContext(command.parent.parent.opts());
        const teamId = await resolveScopedTeamId(ctx, options.team);
        const result = await listCycles(ctx.gql, teamId, options.active || false, { limit: parseLimit(options.limit), after: options.after });
        if (options.window) {
            const n = parseInt(options.window, 10);
            if (Number.isNaN(n) || n < 0) {
                throw invalidParameterError("--window", "requires a non-negative integer");
            }
            const activeCycle = result.nodes.find((c) => c.isActive);
            if (!activeCycle) {
                throw notFoundError("Active cycle", options.team ?? "", "for team");
            }
            const activeNumber = activeCycle.number;
            const min = activeNumber - n;
            const max = activeNumber + n;
            const filteredNodes = result.nodes
                .filter((c) => c.number >= min && c.number <= max)
                .sort((a, b) => a.number - b.number);
            outputSuccess({
                nodes: filteredNodes,
                pageInfo: { hasNextPage: false, endCursor: null },
            });
            return;
        }
        outputSuccess(result);
    }));
    cycles
        .command("read <cycle>")
        .description("get cycle details including issues")
        .option("--team <team>", "scope name lookup to team")
        .option("--limit <n>", "max issues to fetch", "50")
        .action(handleCommand(async (...args) => {
        const [cycle, options, command] = args;
        const ctx = createContext(command.parent.parent.opts());
        const cycleId = await resolveCycleId(ctx.sdk, cycle, options.team);
        const cycleResult = await getCycle(ctx.gql, cycleId, parseLimit(options.limit || "50"));
        outputSuccess(cycleResult);
    }));
    cycles
        .command("usage")
        .description("show detailed usage for cycles")
        .action(() => {
        console.log(formatDomainUsage(cycles, CYCLES_META));
    });
}
