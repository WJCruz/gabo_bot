import fs from 'fs/promises';

const workflowsUrl = new URL('../workflows/', import.meta.url);

let workflowCache;

async function loadWorkflowCache() {
  if (workflowCache) {
    return workflowCache;
  }

  const files = await fs.readdir(workflowsUrl);
  const workflows = new Map();

  await Promise.all(
    files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        const name = file.replace('.json', '');
        const content = await fs.readFile(new URL(file, workflowsUrl), 'utf8');

        workflows.set(name, JSON.parse(content));
      })
  );

  workflowCache = workflows;

  return workflowCache;
}

export async function listWorkflows() {
  const workflows = await loadWorkflowCache();

  return [...workflows.keys()].sort();
}

export async function load(workflowName) {
  const workflows = await loadWorkflowCache();
  const workflow = workflows.get(workflowName);

  if (!workflow) {
    const available = [...workflows.keys()].sort().join(', ');
    const error = new Error(`Unknown workflow "${workflowName}". Available: ${available}`);

    error.status = 400;
    throw error;
  }

  return workflow;
}

export async function ensureWorkflowExists(workflowName) {
  await load(workflowName);
}

export function clearWorkflowCache() {
  workflowCache = undefined;
}

export default {
  listWorkflows,
  load,
  ensureWorkflowExists,
  clearWorkflowCache,
};
