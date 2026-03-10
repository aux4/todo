import { promises as fs } from 'fs';
import { existsSync } from 'fs';

export class TodoUtils {
  /**
   * Check if file exists
   */
  static async fileExists(filePath) {
    return existsSync(filePath);
  }

  /**
   * Read file content
   */
  static async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  /**
   * Write file content
   */
  static async writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Format todo items for display with strikethrough for completed items
   */
  static formatItems(items) {
    return items.map((item, index) => {
      const checkbox = item.completed ? '[x]' : '[ ]';
      const text = item.completed ? this.strikethrough(item.text) : item.text;
      return `${index}: ${checkbox} ${text}`;
    });
  }

  /**
   * Create ASCII strikethrough effect
   */
  static strikethrough(text) {
    // Use Unicode combining strikethrough character
    return text.split('').join('\u0336') + '\u0336';
  }

  /**
   * Get current working directory
   */
  static getCwd() {
    return process.cwd();
  }

  /**
   * Resolve file path relative to current directory
   */
  static resolvePath(filePath) {
    if (filePath.startsWith('/')) {
      return filePath;
    }
    return `${this.getCwd()}/${filePath}`;
  }
}