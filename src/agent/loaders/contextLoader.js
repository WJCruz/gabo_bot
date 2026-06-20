import fs from 'fs/promises';

const contextsUrl = new URL('../../contexts/', import.meta.url);

/**
 * Loads contexts.
 */
export default class ContextLoader {
  /**
   * @param {string} name
   * @returns {Promise<string>}
   */
  async load(name) {
    const fileUrl = new URL(`${name}.md`, contextsUrl);

    return await fs.readFile(fileUrl, 'utf8');
  }
}
