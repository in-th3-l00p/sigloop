import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlowRunner } from "../flows/runner.js";

vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-1234",
});

describe("FlowRunner", () => {
  let runner: FlowRunner;

  beforeEach(() => {
    runner = new FlowRunner();
  });

  describe("run", () => {
    it("executes step and records completed status", async () => {
      const result = await runner.run("step-1", async () => "value");
      expect(result).toBe("value");
    });

    it("returns the value from the step function", async () => {
      const obj = { id: "123", name: "test" };
      const result = await runner.run("step-1", async () => obj);
      expect(result).toEqual(obj);
    });

    it("records failed step and rethrows on error", async () => {
      await expect(
        runner.run("fail-step", async () => {
          throw new Error("step failed");
        })
      ).rejects.toThrow("step failed");
    });

    it("handles non-Error thrown values", async () => {
      await expect(
        runner.run("fail-step", async () => {
          throw "string error";
        })
      ).rejects.toBe("string error");
    });

    it("tracks multiple steps in sequence", async () => {
      await runner.run("step-1", async () => "a");
      await runner.run("step-2", async () => "b");
      await runner.run("step-3", async () => "c");

      const result = runner.result(null);
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].name).toBe("step-1");
      expect(result.steps[0].status).toBe("completed");
      expect(result.steps[1].name).toBe("step-2");
      expect(result.steps[2].name).toBe("step-3");
    });
  });

  describe("result", () => {
    it("returns completed status when all steps succeed", async () => {
      await runner.run("step-1", async () => "ok");
      const result = runner.result("done");
      expect(result.status).toBe("completed");
      expect(result.result).toBe("done");
      expect(result.flowId).toBe("test-uuid-1234");
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].data).toBe("ok");
    });

    it("returns failed status when any step failed", async () => {
      await runner.run("good-step", async () => "ok");
      try {
        await runner.run("bad-step", async () => {
          throw new Error("oops");
        });
      } catch {}

      const result = runner.result(null);
      expect(result.status).toBe("failed");
      expect(result.steps).toHaveLength(2);
      expect(result.steps[1].status).toBe("failed");
      expect(result.steps[1].error).toBe("oops");
    });

    it("records step duration", async () => {
      await runner.run("step-1", async () => {
        return "fast";
      });
      const result = runner.result(null);
      expect(result.steps[0].duration).toBeGreaterThanOrEqual(0);
    });

    it("returns empty steps when no steps run", () => {
      const result = runner.result("empty");
      expect(result.status).toBe("completed");
      expect(result.steps).toEqual([]);
      expect(result.result).toBe("empty");
    });

    it("records overall flow duration", async () => {
      await runner.run("step-1", async () => "ok");
      const result = runner.result(null);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
