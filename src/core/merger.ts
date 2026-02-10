export function mergeTemplateAndPrompt(
  template: string | null,
  improvedPrompt: string
): string {
  if (!template) return improvedPrompt;

  return `${template.trim()}\n\n---\n\n${improvedPrompt.trim()}`;
}
