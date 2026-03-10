export class TodoParser {
  /**
   * Parse JSON content into todo object map
   * Returns an object where keys are todo names and values are item arrays
   */
  static parseContent(content) {
    if (!content || !content.trim()) {
      return {};
    }

    return JSON.parse(content);
  }

  /**
   * Generate JSON content from todo object map
   */
  static generateContent(todos) {
    if (!todos || Object.keys(todos).length === 0) {
      return '{}';
    }

    return JSON.stringify(todos, null, 2);
  }

  /**
   * Validate todo name
   */
  static isValidTodoName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }

    return name.trim().length > 0;
  }

  /**
   * Validate item text
   */
  static isValidItemText(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    return text.trim().length > 0;
  }

  /**
   * Clean/sanitize item text
   */
  static sanitizeItemText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.replace(/[\r\n]/g, ' ').trim();
  }
}
