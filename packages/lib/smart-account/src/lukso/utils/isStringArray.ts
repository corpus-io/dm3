/**
 * Checks if the value is an array of strings
 */
export function isStringArray(value: unknown): value is string[] {
    return (
        Array.isArray(value) && value.every((item) => typeof item === 'string')
    );
}
