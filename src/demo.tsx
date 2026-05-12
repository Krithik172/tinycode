import { render } from "ink";
import { createElement, useState, useEffect } from "react";
import { Layout } from "./tui/layout.js";
import { Header } from "./tui/components/header.js";
import { Footer } from "./tui/components/footer.js";
import {
  ConversationPanel,
  type ConversationEntry,
} from "./tui/panels/conversation.js";
import { getActive } from "./llm/index.js";

function DemoApp() {
  const provider = getActive();
  const [entries, setEntries] = useState<ConversationEntry[]>([]);

  useEffect(() => {
    const demo: ConversationEntry[] = [
      {
        id: "u1",
        type: "user",
        content: "What does src/index.ts do?",
      },
      {
        id: "t1",
        type: "tool",
        content: "read",
        toolName: "read",
        toolStatus: "success",
        args: '{"path":"src/index.ts"}',
      },
      {
        id: "a1",
        type: "assistant",
        content:
          "Let me explain what `src/index.ts` does.\n\nThe file reads **src/index.ts** and outputs its contents with line numbers. It uses:\n\n- **offset** — where to start reading\n- **limit** — how many lines to read\n\nHere's a code block:\n\n```\nconst result = await readTool.execute({\n  path: \"src/index.ts\"\n});\n```\n\n> This is useful for understanding file structure.\n\nList of features:\n- File reading\n- Writing\n- Bash execution\n- Grep search",
        isStreaming: true,
      },
    ];

    // Simulate streaming: reveal text character by character
    let index = 0;
    const fullText = demo[2].content;
    setEntries(demo.slice(0, 2));
    setEntries([...demo.slice(0, 2), { ...demo[2], content: "" }]);

    const interval = setInterval(() => {
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setEntries((prev) => [
          ...prev.slice(0, -1),
          { ...prev[prev.length - 1], content: fullText, isStreaming: false },
        ]);
        return;
      }
      setEntries((prev) => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], content: fullText.slice(0, index) },
      ]);
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout
      header={
        <Header
          providerName={provider.name}
          modelName={provider.models[0]}
          tokenUsage={{ inputTokens: 400, outputTokens: 834, totalTokens: 1234 }}
          modelConfig={provider.modelConfig?.[provider.models[0]]}
        />
      }
      conversationPanel={<ConversationPanel entries={entries} />}
      previewPanel={<></>}
      footer={<Footer statusText="Streaming..." onSubmit={() => {}} />}
    />
  );
}

const { waitUntilExit } = render(createElement(DemoApp));
await waitUntilExit();
