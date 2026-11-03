// Drizzle notun version-e pg error `cause`-er vitore thake, tai duto jaygai check
export const isUniqueViolation = (e: any) => (e?.code ?? e?.cause?.code) === '23505';