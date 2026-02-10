import clipboardy from "clipboardy";

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await clipboardy.write(text);
    return true;
  } catch {
    console.error("Failed to copy to clipboard.");
    return false;
  }
}
