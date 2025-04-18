import { LLMClient } from "./llm_client";
import { MCPClientApplication } from "./mcp_client";

const client = new LLMClient();

const app = new MCPClientApplication();
await app.init();
await app.runConversation();
await app.close();
