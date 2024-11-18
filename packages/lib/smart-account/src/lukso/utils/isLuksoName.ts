export const isLuksoName = (input: string): boolean => {
    const regex = /^[a-zA-Z0-9]+#[a-zA-Z0-9]{4}\.up$/;
    return regex.test(input);
};
