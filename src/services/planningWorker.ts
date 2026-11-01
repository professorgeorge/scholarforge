import { simulatePlanning } from "./planningService";
self.onmessage = (event) => {
  try {
    self.postMessage({ result: simulatePlanning(event.data) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Simulation failed.",
    });
  }
};
