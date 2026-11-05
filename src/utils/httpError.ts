export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly links?: Record<string, { href: string; method: string }>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
