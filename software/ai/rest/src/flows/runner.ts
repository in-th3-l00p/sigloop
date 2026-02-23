import type { FlowStep, FlowResult } from "../types/index.js";

type StepFn<T> = () => Promise<T>;

export class FlowRunner {
  private steps: FlowStep[] = [];
  private startTime = Date.now();

  async run<T>(name: string, fn: StepFn<T>): Promise<T> {
    const stepStart = Date.now();
    try {
      const data = await fn();
      this.steps.push({
        name,
        status: "completed",
        data,
        duration: Date.now() - stepStart,
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.steps.push({
        name,
        status: "failed",
        error: message,
        duration: Date.now() - stepStart,
      });
      throw err;
    }
  }

  result<T>(data: T): FlowResult<T> {
    return {
      flowId: crypto.randomUUID(),
      status: this.steps.every((s) => s.status === "completed")
        ? "completed"
        : "failed",
      steps: this.steps,
      result: data,
      duration: Date.now() - this.startTime,
    };
  }
}
