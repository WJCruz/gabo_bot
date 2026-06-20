import fs from 'fs/promises';

const workflowsUrl = new URL('../../workflows/', import.meta.url);

/**
 * Loads workflows.
 */
export default class WorkflowLoader {
  /**
   * @param {string} name
   * @returns {Promise<Object>}
   */
  async load(name) {
    const fileUrl = new URL(`${name}.json`, workflowsUrl);

    const content = await fs.readFile(fileUrl, 'utf8');

    return JSON.parse(content);
  }
}
