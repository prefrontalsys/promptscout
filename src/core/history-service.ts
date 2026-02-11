import type { HistoryRepo } from "../storage/history-repo.js";
import type { HistoryEntry } from "../types.js";
import { HISTORY_PREVIEW_LENGTH } from "../constants.js";
import { truncate } from "../utils/text.js";

export interface HistoryListItem {
  id: number;
  createdAt: string;
  templateName: string | null;
  preview: string;
}

export class HistoryService {
  constructor(private historyRepo: HistoryRepo) {}

  list(all: boolean, limit: number): HistoryListItem[] {
    const directory = all ? undefined : process.cwd();
    const entries = this.historyRepo.list(directory, limit);
    return entries.map((e) => ({
      id: e.id,
      createdAt: e.created_at,
      templateName: e.template_name,
      preview: truncate(e.raw_input, HISTORY_PREVIEW_LENGTH),
    }));
  }

  findById(id: number): HistoryEntry | undefined {
    return this.historyRepo.findById(id);
  }

  clear(): void {
    this.historyRepo.clear();
  }
}
