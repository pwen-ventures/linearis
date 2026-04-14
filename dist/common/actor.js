export function getActorOverridesFromEnv(env = process.env) {
    const overrides = {};
    const createAsUser = env.LINEAR_CREATE_AS_USER?.trim();
    const displayIconUrl = env.LINEAR_DISPLAY_ICON_URL?.trim();
    if (createAsUser) {
        overrides.createAsUser = createAsUser;
    }
    if (displayIconUrl) {
        overrides.displayIconUrl = displayIconUrl;
    }
    return overrides;
}
export function applyActorOverrides(input, overrides) {
    return {
        ...overrides,
        ...input,
    };
}
