import { createServer, type Server, type IncomingMessage, type ServerResponse } from "http";
import type { PaymentRequirementsResponse } from "./types.js";

const PAYMENT_REQUIREMENTS: PaymentRequirementsResponse = {
  paymentRequirements: {
    scheme: "exact",
    network: "base-sepolia",
    maxAmountRequired: "1000000",
    resource: "https://api.example.com/data",
    description: "API access fee",
    mimeType: "application/json",
  },
};

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const paymentHeader = req.headers["x-payment"];

  if (paymentHeader && typeof paymentHeader === "string") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: { result: "success", message: "Payment accepted" },
        paymentVerified: true,
      })
    );
    return;
  }

  res.writeHead(402, { "Content-Type": "application/json" });
  res.end(JSON.stringify(PAYMENT_REQUIREMENTS));
}

export function createMockX402Server(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);
    server.listen(port, "127.0.0.1", () => {
      resolve(server);
    });
    server.on("error", reject);
  });
}

export function closeMockX402Server(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
