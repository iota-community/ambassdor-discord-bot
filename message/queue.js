const processMessage = require('./processMessage');

async function loadPQueue() {
  return (await import('p-queue')).default;
}

async function setupQueue() {
  const PQueue = await loadPQueue();
  const queue = new PQueue({ concurrency: 2 });

  async function addJob(job) {
    await queue.add(() => processMessage(job));
  }

  return { addJob };
}

// Export a promise that resolves when the queue is set up
module.exports = setupQueue();
