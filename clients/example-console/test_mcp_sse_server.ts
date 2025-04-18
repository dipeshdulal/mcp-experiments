import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const app = express();

const server = new McpServer(
  {
    name: "Test SSE MCP Server",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

server.tool(
  "fetch-weather",
  "Fetches weather",
  {
    city: z.string(),
  },
  async ({ city }) => {
    return Promise.resolve({
      content: [
        {
          type: "text",
          text: `The weather in ${city} is sunny.`,
        },
      ],
    });
  },
);

let transport: SSEServerTransport | undefined;
app.get("/sse", async (_: any, res: any) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req: any, res: any) => {
  if (transport) {
    console.log("transport is found, handle post message");
    await transport.handlePostMessage(req, res);
  }
});

app.listen(3000, () => {
  console.log("SSE server listening on port 3000");
});
