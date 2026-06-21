/**
 * Builds the final prompt.
 */
export default class PromptBuilder {
  /**
   * @param {Object} params
   * @param {string[]} params.contexts
   * @param {string[]} params.skills
   * @param {string} params.question
   * @returns {string}
   */
  build({ contexts, skills, question }) {
    return `
# CONTEXTS

${contexts.join('\n\n')}

# SKILLS

${skills.join('\n\n')}

# QUESTION

${question}

# INSTRUCTIONS

Follow the provided contexts and skills.
Respond clearly and structurally.
Respond in Spanish unless the user explicitly asks for another language.
`;
  }
}
