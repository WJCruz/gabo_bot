import fs from 'fs/promises';

const skillsUrl = new URL('../../skills/', import.meta.url);

/**
 * Loads skills.
 */
export default class SkillLoader {
  /**
   * @param {string} name
   * @returns {Promise<string>}
   */
  async load(name) {
    const fileUrl = new URL(`${name}.md`, skillsUrl);

    return await fs.readFile(fileUrl, 'utf8');
  }
}
