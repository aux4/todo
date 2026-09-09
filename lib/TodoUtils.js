import { existsSync, promises as fs } from 'fs';

const LOCK_RETRY_MS = 50;
const LOCK_MAX_RETRIES = 20;
const LOCK_STALE_MS = 10000;
const DESC_CHUNK = 500;

export function idNum(id) {
  const d = id.indexOf('-');
  return d >= 0 ? (parseInt(id.slice(d + 1), 10) || 0) : 0;
}

export class TodoUtils {
  static async fileExists(filePath) {
    return existsSync(filePath);
  }

  static async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') return '';
      throw error;
    }
  }

  static async writeFile(filePath, content) {
    const tmpPath = `${filePath}.tmp.${process.pid}`;
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, filePath);
  }

  static async acquireLock(filePath) {
    const lockPath = `${filePath}.lock`;
    for (let i = 0; i < LOCK_MAX_RETRIES; i++) {
      try {
        const fd = await fs.open(lockPath, 'wx');
        await fd.write(String(process.pid));
        await fd.close();
        return lockPath;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          const stat = await fs.stat(lockPath);
          if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) { await fs.unlink(lockPath); continue; }
        } catch (_) { continue; }
        await new Promise(r => setTimeout(r, LOCK_RETRY_MS));
      }
    }
    throw new Error('Could not acquire lock. Another process may be writing.');
  }

  static async releaseLock(lockPath) {
    try { await fs.unlink(lockPath); } catch (_) {}
  }

  static statusMarker(status) {
    if (status === 'done') return '[x]';
    if (status === 'doing') return '[~]';
    return '[ ]';
  }

  // Slim one-line rendering for view / subtasks / archive list.
  // Expects an enriched item: { id, text, status, assignee?, hasDescription, subtaskTotal, subtaskCompleted, commentCount }
  static formatItemLine(item) {
    const id = item.id || '?';
    const status = item.status || 'open';
    const marker = this.statusMarker(status);
    const text = status === 'done' ? this.strikethrough(item.text) : item.text;
    const parts = [`${id}: ${marker} ${text}`];

    if (item.assignee) parts.push(`@${item.assignee}`);
    if (item.hasDescription) parts.push('+desc');
    if (item.subtaskTotal > 0) {
      const s = item.subtaskTotal !== 1 ? 's' : '';
      parts.push(`(${item.subtaskTotal} subtask${s}: ${item.subtaskCompleted}/${item.subtaskTotal})`);
    }
    if (item.commentCount > 0) {
      const s = item.commentCount !== 1 ? 's' : '';
      parts.push(`(${item.commentCount} comment${s})`);
    }

    return parts.join(' ');
  }

  static formatCommentLine(c) {
    const date = new Date(c.date).toLocaleString();
    return `  [${date}] ${c.author}: ${c.message}`;
  }

  static descBody(desc, full) {
    if (full || desc.length <= DESC_CHUNK) return desc;
    return `${desc.slice(0, DESC_CHUNK)}…(truncated — --full for all)`;
  }

  static strikethrough(text) {
    return text.split('').join('̶') + '̶';
  }
}
