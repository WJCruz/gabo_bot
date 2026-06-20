import ContextLoader from './loaders/contextLoader.js';
import SkillLoader from './loaders/skillLoader.js';
import WorkflowLoader from './loaders/workflowLoader.js';
import PromptBuilder from './promptBuilder.js';

/**
 * Main agent orchestrator.
 */
export default class Agent {
  /**
   * @param {Object} provider
   */
  constructor(provider, options = {}) {
    this.provider = provider;

    this.contextLoader = options.contextLoader || new ContextLoader();
    this.skillLoader = options.skillLoader || new SkillLoader();
    this.workflowLoader = options.workflowLoader || new WorkflowLoader();
    this.promptBuilder = options.promptBuilder || new PromptBuilder();
  }

  /**
   * Executes a workflow.
   *
   * @param {string} workflowName
   * @param {string} question
   * @returns {Promise<string>}
   */
  async ask(workflowName, question) {
    const workflow = await this.workflowLoader.load(workflowName);

    const contexts = await Promise.all(
      workflow.contexts.map((name) => this.contextLoader.load(name))
    );

    const skills = await Promise.all(
      workflow.skills.map((name) => this.skillLoader.load(name))
    );

    const prompt = this.promptBuilder.build({
      contexts,
      skills,
      question,
    });

    return await this.provider.generate(prompt);
  }
}
