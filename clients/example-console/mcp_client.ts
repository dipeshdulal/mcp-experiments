import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { LLMClient } from "./llm_client";
import type OpenAI from "openai";
import readline from "readline";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class MCPClientApplication {
  private mcpClient: Client;
  private llmClient: LLMClient;
  private messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];
  private tools: Array<OpenAI.Chat.ChatCompletionTool> = [];
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.mcpClient = new Client(
      {
        name: "Console MCP Client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );
    this.llmClient = new LLMClient();
  }

  async init() {
    console.log("initializing mcp client...");

    // const transport = new StdioClientTransport({
    //   command: "bun",
    //   args: ["run", "./test_mcp_server.ts"],
    // });

    const transport = new SSEClientTransport(
      new URL("https://8509-2404-7c00-48-6d1d-7034-3060-d8d3-d50d.ngrok-free.app/sse"),
    );

    await this.mcpClient.connect(transport);

    console.log("discovering tools from mcp server...");
    const toolsResult = await this.mcpClient.listTools();

    console.log("discovered tools num:", toolsResult.tools.length);
    this.tools = toolsResult.tools.map((tool) => {
      console.log("tool:", tool.name);
      return {
        function: {
          name: tool.name,
          description: tool.description || `Tool: ${tool.name}`,
          parameters: tool.inputSchema,
        },
        type: "function",
      };
    });
  }

  async runConversation() {
    console.log("welcome to mcp llm application.");
    console.log("type your messages below.Type 'exit' to quit.\n");

    while (true) {
      const userMessage = await this.promptUser("You: ");

      if (userMessage.toLowerCase() === "exit") {
        break;
      }

      this.messages.push({
        role: "user",
        content: userMessage,
      });

      const llmResponse = await this.llmClient.sendMessage(
        this.messages,
        this.tools,
      );

      if (llmResponse?.tool_calls && llmResponse?.tool_calls?.length > 0) {
        await this.handleToolCall(llmResponse?.tool_calls);
      } else {
        console.log("\nAssistant:", llmResponse?.content);
        this.messages.push({
          role: "assistant",
          content: llmResponse?.content,
        });
      }
    }

    console.log("Exiting...");
  }

  async handleToolCall(toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]) {
    console.log("\nAssistant wants to use tools: ");
    for (const toolCall of toolCalls) {
      console.log("Tool:", toolCall.function.name);
      console.log("Arguments:", toolCall.function.arguments);

      const approved = await this.promptYesNo(
        "Approve tool execution? (y/n): ",
      );
      if (approved) {
        console.log(`Executing tool ${toolCall.function.name}...`);

        const args = JSON.parse(toolCall.function.arguments);
        const result = await this.mcpClient.callTool({
          name: toolCall.function.name,
          arguments: args,
        });

        console.log("tool execution result: ", result);

        this.messages.push({
          role: "assistant",
          content: null,
          tool_calls: [
            {
              type: "function",
              id: toolCall.id,
              function: {
                arguments: toolCall.function.arguments,
                name: toolCall.function.name,
              },
            },
          ],
        });

        this.messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result.isError
            ? `Error: ${result.error}`
            : (result.content as any),
        });
      } else {
        console.log("Tool execution denied.");
        this.messages.push({
          role: "system",
          content: `Tool call to ${toolCall.function.name} was denied by user.`,
        });
      }
    }

    console.log(this.messages);

    const finalResponse = await this.llmClient.sendMessage(
      this.messages,
      this.tools,
    );
    console.log("\nAssistant:", finalResponse?.content);
    this.messages.push({
      role: "assistant",
      content: finalResponse?.content,
    });
  }

  async promptUser(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  async promptYesNo(prompt: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.toLowerCase().startsWith("y"));
      });
    });
  }

  async close() {
    this.rl.close();
    await this.mcpClient.close();
  }
}
