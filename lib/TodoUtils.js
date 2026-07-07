import { promises as fs } from 'fs';
import { existsSync } from 'fs';

const LOCK_RETRY_MS = 50;
const LOCK_MAX_RETRIES = 20;
const LOCK_STALE_MS = 10000;

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

  static formatItems(items) {
    const lines = [];
    for (const item of items) {
      const id = item.id || '?';
      const status = item.status || (item.completed ? 'done' : 'open');
      const checkbox = status === 'done' ? '[x]' : status === 'doing' ? '[~]' : '[ ]';
      const text = status === 'done' ? this.strikethrough(item.text) : item.text;
      const parts = [`${id}: ${checkbox} ${text}`];

      if (item.assignee) parts.push(`@${item.assignee}`);
      if (item.subtaskTotal > 0) {
        const s = item.subtaskTotal !== 1 ? 's' : '';
        parts.push(`(${item.subtaskTotal} subtask${s}: ${item.subtaskCompleted}/${item.subtaskTotal})`);
      }
      if (item.comments && item.comments.length > 0) {
        const s = item.comments.length !== 1 ? 's' : '';
        parts.push(`(${item.comments.length} comment${s})`);
      }

      lines.push(parts.join(' '));
      if (item.description) lines.push(`            ${item.description}`);
    }
    return lines;
  }

  static formatComments(comments) {
    if (!comments || comments.length === 0) return ['  (no comments)'];
    return comments.map(c => {
      const date = new Date(c.date).toLocaleString();
      return `  [${date}] ${c.author}: ${c.message}`;
    });
  }

  static strikethrough(text) {
    return text.split('').join('\u0336') + '\u0336';
  }
}
