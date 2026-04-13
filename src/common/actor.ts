export interface ActorOverrides {
  createAsUser?: string;
  displayIconUrl?: string;
}

export function getActorOverridesFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ActorOverrides {
  const overrides: ActorOverrides = {};
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

export function applyActorOverrides<T extends object>(input: T): T {
  const overrides = getActorOverridesFromEnv();
  return {
    ...overrides,
    ...input,
  };
}
