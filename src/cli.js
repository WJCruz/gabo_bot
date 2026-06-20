import input from '@inquirer/input';
import select from '@inquirer/select';

import env, { validateEnv } from './config/env.js';
import agentService from './services/agent.service.js';
import workflowService from './services/workflow.service.js';

async function main() {
  try {
    validateEnv();

    console.log('\n====================');
    console.log('GABO AGENT');
    console.log('====================\n');

    const workflows = await workflowService.listWorkflows();
    const workflow = await select({
      message: 'Select a workflow',
      choices: workflows.map((name) => ({ name, value: name })),
      default: workflows.includes(env.defaultWorkflow) ? env.defaultWorkflow : workflows[0],
    });

    const question = await input({
      message: 'Question',
    });

    console.log('\nThinking...\n');

    const result = await agentService.ask({
      workflow,
      question,
    });

    console.log(result.answer);
  } catch (error) {
    console.error('\nError:\n');
    console.error(error.message);
  }
}

await main();
