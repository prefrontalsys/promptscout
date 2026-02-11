import ky from "ky";

export interface HfModelResult {
  id: string;
  downloads: number;
}

export interface HfFileInfo {
  name: string;
  size: number;
  quantTag: string;
}

const HF_API = "https://huggingface.co/api";

export async function searchModels(query: string): Promise<HfModelResult[]> {
  const data = await ky
    .get(`${HF_API}/models`, {
      searchParams: {
        filter: "gguf",
        search: query,
        sort: "downloads",
        limit: 20,
      },
    })
    .json<{ id: string; downloads: number }[]>();

  return data.map((m) => ({ id: m.id, downloads: m.downloads }));
}

export async function listModelFiles(repoId: string): Promise<HfFileInfo[]> {
  const entries = await ky
    .get(`${HF_API}/models/${repoId}/tree/main`)
    .json<{ path: string; size: number }[]>();

  return entries
    .filter((e) => e.path.endsWith(".gguf"))
    .map((e) => {
      const parts = e.path.replace(".gguf", "").split(/[.\-]/);
      const quantTag = extractQuantTag(parts) ?? e.path;
      return { name: e.path, size: e.size, quantTag };
    });
}

function extractQuantTag(parts: string[]): string | undefined {
  const quantPattern = /^[QqIiFK]\d/;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (quantPattern.test(parts[i])) {
      return parts.slice(i).join("_");
    }
  }
  return undefined;
}

export function formatFileSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}
