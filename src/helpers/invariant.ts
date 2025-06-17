export function invariant(
  value: unknown,
  message = 'Expected value to be defined.',
): asserts value {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}
