/**
 * glbRenderWorker.js
 *
 * @description :: Worker thread entry point for glbRenderer.renderGlb, so that
 *   the CPU-bound rasterization never blocks the API event loop. Started by
 *   glbRenderer.renderGlbInWorker.
 */

const { parentPort, workerData } = require('worker_threads');
const { renderGlb } = require('./glbRenderer');

renderGlb(workerData.glb)
  .then((png) => parentPort.postMessage({ png }))
  .catch((err) =>
    parentPort.postMessage({
      error: { name: err.constructor.name, message: err.message },
    })
  );
