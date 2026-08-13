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

  static _checkbox(status) {
    return status === 'done' ? '[x]' : status === 'doing' ? '[~]' : '[ ]';
  }

  /**
   * Slim, one-line-per-item index. Never prints the description body or
   * comments — only a `+desc` marker when a description exists. This is the
   * low-context read model used by `view` / `archive list`.
   */
  static formatItems(items) {
    const lines = [];
    for (const item of items) {
      const id = item.id || '?';
      const status = item.status || (item.completed ? 'done' : 'open');
      const checkbox = this._checkbox(status);
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
      if (item.description) parts.push('+desc');

      lines.push(parts.join(' '));
    }
    return lines;
  }

  /**
   * Full single-item detail: header, meta line (status/assignee/subtasks),
   * description chunk (truncated unless `detail.full`), and the last N comments.
   */
  static formatItem(detail) {
    const lines = [];
    lines.push(`## ${detail.name} > ${detail.id}: ${detail.text}`);

    const meta = [`Status: ${detail.status} ${this._checkbox(detail.status)}`];
    if (detail.assignee) meta.push(`Assignee: @${detail.assignee}`);
    if (detail.subtaskTotal > 0) meta.push(`Subtasks: ${detail.subtaskCompleted}/${detail.subtaskTotal}`);
    if (detail.archived) meta.push('(archived)');
    lines.push(meta.join('   '));

    if (detail.description) {
      lines.push('');
      lines.push('Description:');
      let desc = detail.description;
      if (!detail.full && desc.length > 500) {
        desc = desc.slice(0, 500) + ' …(truncated — --full for all)';
      }
      lines.push(desc);
    }

    lines.push('');
    if (detail.commentTotal === 0) {
      lines.push('Comments: (none)');
    } else {
      const shown = detail.comments.length;
      lines.push(`Comments (showing last ${shown} of ${detail.commentTotal}):`);
      for (const line of this.formatComments(detail.comments)) lines.push(line);
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
