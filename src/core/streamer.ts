export function createTokenHandler(): (token: string) => void {
  return (token: string) => {
    process.stdout.write(token);
  };
}

export function endStream(): void {
  process.stdout.write("\n");
}
