export interface ITLDResolver {
    isResolverForTldName(ensName: string): Promise<boolean>;
    isResolverForAliasName(
        ensName: string,
        foreignTldName?: string,
    ): Promise<boolean>;
    resolveAliasToTLD(
        ensName: string,
        //In case a foreign name needs to be resolved, the tldName is provided by the stroage, using this optional parameter
        foreignTldName?: string,
    ): Promise<string>;
    resolveTLDtoAlias(ensName: string): Promise<string>;
}
