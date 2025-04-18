import OpenAI from "openai";
import type { ClientOptions } from "openai/index.mjs";

export class LLMClient {
  client: OpenAI;

  constructor(opts?: ClientOptions) {
    this.client = new OpenAI(opts);
  }

  // sendMessage sends message to llm client provided message and tools
  // it returns the response from the llm
  // @param messages - Array of messages to send to the LLM
  // @param tools - Array of tools to use with the LLM
  async sendMessage(
    messages: Array<OpenAI.Chat.ChatCompletionMessageParam>,
    tools: Array<OpenAI.Chat.ChatCompletionTool>,
  ): Promise<OpenAI.Chat.ChatCompletionMessage | undefined> {
    // Placeholder for sending messages to the LLM
    console.log(
      "\n=====\nSending messages to LLM:\n=====\n",
      messages[messages.length - 1],
      "\n",
    );

    const completions = await this.client.chat.completions.create({
      model: "gpt-4.1",
      messages: messages,
      tools,
    });

    return completions.choices[0]?.message;
  }
}
