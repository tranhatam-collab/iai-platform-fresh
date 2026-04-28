interface StringOptions {
  defaultValue?: string;
  required?: boolean;
}

interface NumberOptions {
  defaultValue?: number;
  max?: number;
  min?: number;
  required?: boolean;
}

interface EnumOptions<T extends string> {
  defaultValue?: T;
  required?: boolean;
}

type EnvSource = NodeJS.ProcessEnv;

export function readString(
  env: EnvSource,
  key: string,
  options: StringOptions = {}
) {
  const rawValue = env[key]?.trim();
  if (rawValue) {
    return rawValue;
  }

  if (options.defaultValue !== undefined) {
    return options.defaultValue;
  }

  if (options.required === false) {
    return undefined;
  }

  throw new Error(`Missing required environment variable: ${key}`);
}

export function readNumber(
  env: EnvSource,
  key: string,
  options: NumberOptions = {}
) {
  const rawValue = env[key]?.trim();
  if (!rawValue) {
    if (options.defaultValue !== undefined) {
      return options.defaultValue;
    }

    if (options.required === false) {
      return undefined;
    }

    throw new Error(`Missing required environment variable: ${key}`);
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a finite number.`);
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`Environment variable ${key} must be >= ${options.min}.`);
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`Environment variable ${key} must be <= ${options.max}.`);
  }

  return parsed;
}

export function readBoolean(
  env: EnvSource,
  key: string,
  defaultValue = false
) {
  const rawValue = env[key]?.trim().toLowerCase();
  if (!rawValue) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  throw new Error(`Environment variable ${key} must be boolean-like.`);
}

export function readEnum<const T extends readonly string[]>(
  env: EnvSource,
  key: string,
  allowedValues: T,
  options: EnumOptions<T[number]> = {}
): T[number] {
  const value = readString(env, key, {
    defaultValue: options.defaultValue,
    required: options.required
  });

  if (value === undefined) {
    throw new Error(`Missing enum environment variable: ${key}`);
  }

  if (allowedValues.includes(value as T[number])) {
    return value as T[number];
  }

  throw new Error(
    `Environment variable ${key} must be one of: ${allowedValues.join(", ")}`
  );
}

export function readCsv(env: EnvSource, key: string, defaultValue = "") {
  const value = readString(env, key, {
    defaultValue,
    required: false
  });

  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
