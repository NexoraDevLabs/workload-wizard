export async function withDbSpan<T>(
  operation: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  void operation;
  void attributes;
  return fn();
}
