const { performance } = require('perf_hooks');

// Mock data
const mockFileHandles = Array.from({ length: 50 }).map((_, i) => ({
  getFile: async () => {
    // simulate file access time
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
      name: `file${i}.md`,
      text: async () => {
        // simulate text parsing time
        await new Promise(resolve => setTimeout(resolve, 10));
        return `content for file ${i}`;
      }
    };
  }
}));

const mockOpenDocumentTab = (name, content, title, handle) => {
  // simulate DOM operations or internal state changes
  // minimal time
};

async function sequentialOpen() {
  const start = performance.now();
  for (const handle of mockFileHandles) {
    const file = await handle.getFile();
    const content = await file.text();
    mockOpenDocumentTab(file.name, content, file.name, handle);
  }
  const end = performance.now();
  return end - start;
}

async function parallelOpen() {
  const start = performance.now();
  const filePromises = mockFileHandles.map(async (handle) => {
    const file = await handle.getFile();
    const content = await file.text();
    return { file, content, handle };
  });

  const filesData = await Promise.all(filePromises);

  for (const data of filesData) {
    mockOpenDocumentTab(data.file.name, data.content, data.file.name, data.handle);
  }
  const end = performance.now();
  return end - start;
}

async function run() {
  console.log('Running sequential...');
  const seqTime = await sequentialOpen();
  console.log(`Sequential: ${seqTime.toFixed(2)} ms`);

  console.log('Running parallel...');
  const parTime = await parallelOpen();
  console.log(`Parallel: ${parTime.toFixed(2)} ms`);

  console.log(`Improvement: ${((seqTime - parTime) / seqTime * 100).toFixed(2)}% faster`);
}

run();
