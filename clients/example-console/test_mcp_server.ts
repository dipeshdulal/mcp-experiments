import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Test MCP Server",
  version: "1.0.0",
});

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

const transport = new StdioServerTransport();
await server.connect(transport);
