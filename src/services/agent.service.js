import Agent from '../agent/agent.js';
import GeminiProvider from '../providers/gemini.js';
import env from '../config/env.js';
import workflowService from './workflow.service.js';

const provider = new GeminiProvider(env.geminiApiKey);
const agent = new Agent(provider, {
  workflowLoader: workflowService,
});

export async function ask({ workflow, question }) {
  const selectedWorkflow = String(workflow || env.defaultWorkflow).trim();
  const selectedQuestion = String(question || '').trim();

  if (!selectedQuestion) {
    const error = new Error('Missing required field: question');

    error.status = 400;
    throw error;
  }

  await workflowService.ensureWorkflowExists(selectedWorkflow);

  const answer = await agent.ask(selectedWorkflow, selectedQuestion);

  return {
    workflow: selectedWorkflow,
    question: selectedQuestion,
    answer,
  };
}

export default {
  ask,
};
