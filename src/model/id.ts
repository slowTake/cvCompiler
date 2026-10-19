let counter = 0;

/** Short, unique-enough ids for list entries. Not security relevant. */
export function newId(): string {
  counter = (counter + 1) % 0x10000;
  return (
    Date.now().toString(36).slice(-5) +
    Math.random().toString(36).slice(2, 7) +
    counter.toString(36)
  );
}
