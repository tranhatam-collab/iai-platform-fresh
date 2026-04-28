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
export declare function readString(env: EnvSource, key: string, options?: StringOptions): string | undefined;
export declare function readNumber(env: EnvSource, key: string, options?: NumberOptions): number | undefined;
export declare function readBoolean(env: EnvSource, key: string, defaultValue?: boolean): boolean;
export declare function readEnum<const T extends readonly string[]>(env: EnvSource, key: string, allowedValues: T, options?: EnumOptions<T[number]>): T[number];
export declare function readCsv(env: EnvSource, key: string, defaultValue?: string): string[];
export {};
