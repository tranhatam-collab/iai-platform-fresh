export function readString(env, key, options = {}) {
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
export function readNumber(env, key, options = {}) {
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
export function readBoolean(env, key, defaultValue = false) {
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
export function readEnum(env, key, allowedValues, options = {}) {
    const value = readString(env, key, {
        defaultValue: options.defaultValue,
        required: options.required
    });
    if (value === undefined) {
        throw new Error(`Missing enum environment variable: ${key}`);
    }
    if (allowedValues.includes(value)) {
        return value;
    }
    throw new Error(`Environment variable ${key} must be one of: ${allowedValues.join(", ")}`);
}
export function readCsv(env, key, defaultValue = "") {
    const value = readString(env, key, {
        defaultValue,
        required: false
    });
    return (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
//# sourceMappingURL=env.js.map