# example-console

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## How SSE Transport Works.

1. Client creates connection to server using SSE endpoint.
2. The SSE endpoint returns where to send request for information from the server.
   Which means there is 2 communication channels;
   one is for sending request from MCP Server to MCP client (/sse) endpoint.
   another is for sending request to MCP Server from MCP client (/messages) endpoint.
3. Upon RPC communication channel established, client sends requests using `/messages` endpoint.
4. Server sends response to client that was listening to the `/sse` endpoint.

Transport uses the JSON-RPC protocol to communicate.
