import { useState, useRef, useReducer } from "react";
import { useInput, useApp } from "ink";
import { Layout } from "./layout.js";
import { Header } from "./components/header.js";
import { Footer } from "./components/footer.js";
import {
  ConversationPanel,
  type ConversationEntry,
} from "./panels/conversation.js";
import { PreviewPanel, type PreviewEntry } from "./panels/preview.js";
import { getActive, setActive, setActiveModel, getActiveModel, list } from "../llm/index.js";
import { runAgent } from "../agent.js";
import { Session, type TokenUsage } from "../session.js";
import { findCommand, getAllCommands, type CommandContext } from "./commands.js";

let idCounter = 0;
function nextId(): string {
  return `e${++idCounter}`;
}

export function App() {
  const { exit } = useApp();
  const provider = getActive();
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const sessionRef = useRef(new Session());
  const isRunningRef = useRef(false);
  const assistantIdRef = useRef("");

  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  });
  const [statusText, setStatusText] = useState("Ready");
  const [showPreview, setShowPreview] = useState(false);

  useInput((input, key) => {
    if (key.escape) {
      exit();
    }
    if (key.ctrl && (input === "\x02" || input === "b" || input === "B")) {
      setShowPreview((p) => !p);
    }
  });

  function addEntry(e: ConversationEntry) {
    setEntries((prev) => [...prev, e]);
  }

  function appendAssistantDelta(delta: string) {
    setEntries((prev) => {
      const last = prev[prev.length - 1];
      if (last?.type === "assistant" && last.id === assistantIdRef.current) {
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + delta },
        ];
      }
      return [
        ...prev,
        {
          id: assistantIdRef.current,
          type: "assistant" as const,
          content: delta,
          isStreaming: true,
        },
      ];
    });
  }

  function updateEntry(
    id: string,
    updater: (e: ConversationEntry) => ConversationEntry,
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? updater(e) : e)),
    );
  }

  function addPreviewEntry(pe: PreviewEntry) {
    setPreviewEntries((prev) => [...prev, pe]);
    setShowPreview(true);
  }

  function updatePreviewEntry(
    id: string,
    updater: (pe: PreviewEntry) => PreviewEntry,
  ) {
    setPreviewEntries((prev) =>
      prev.map((pe) => (pe.id === id ? updater(pe) : pe)),
    );
  }

  const commandCtx: CommandContext = {
    exit,
    addEntry,
    setStatusText,
    forceRender,
    nextId,
    resetSession: () => {
      setEntries([]);
      setPreviewEntries([]);
      setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
      setShowPreview(false);
      setStatusText("Ready");
      sessionRef.current = new Session();
      forceRender();
    },
    getActiveLlm: getActive,
    setActiveLlm: setActive,
    setActiveModel,
    getActiveModel,
    listProviders: list,
  };

  async function handleSubmit(value: string) {
    if (isRunningRef.current) return;

    if (value.startsWith("/")) {
      await handleCommand(value);
      return;
    }

    isRunningRef.current = true;
    const session = sessionRef.current;

    addEntry({
      id: nextId(),
      type: "user",
      content: value,
    });

    setStatusText("Thinking...");
    assistantIdRef.current = nextId();

    try {
      const result = await runAgent(value, session, {
        onTextDelta: (delta) => {
          appendAssistantDelta(delta);
        },
        onToolCall: (call) => {
          const toolEntry: ConversationEntry = {
            id: call.id,
            type: "tool",
            content: "",
            toolName: call.name,
            toolStatus: "running",
            args: call.args,
          };
          addEntry(toolEntry);

          addPreviewEntry({
            id: call.id,
            toolName: call.name,
            label: call.args.slice(0, 80),
            content: "",
            status: "running",
          });
        },
        onToolResult: (res) => {
          updateEntry(res.id, (e) => ({
            ...e,
            toolStatus: "success" as const,
            content: res.output,
          }));
          updatePreviewEntry(res.id, (pe) => ({
            ...pe,
            status: "success",
            content: res.output,
          }));
        },
        onError: (err) => {
          setStatusText(`Error: ${err.message}`);
          setEntries((prev) =>
            prev.map((e) =>
              e.toolStatus === "running"
                ? { ...e, toolStatus: "error" as const }
                : e,
            ),
          );
          setPreviewEntries((prev) =>
            prev.map((pe) =>
              pe.status === "running"
                ? { ...pe, status: "error" }
                : pe,
            ),
          );
        },
      });

      setTokenUsage(result.tokenUsage);
      setStatusText("Ready");

      setEntries((prev) =>
        prev.map((e) =>
          e.id === assistantIdRef.current
            ? { ...e, isStreaming: false }
            : e,
        ),
      );
    } catch {
      setStatusText("Error occurred");
    } finally {
      isRunningRef.current = false;
    }
  }

  function handleCommand(value: string) {
    const parts = value.split(/\s+/);
    const cmdLabel = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = findCommand(cmdLabel);
    if (cmd) {
      cmd.handler(args, commandCtx);
      return;
    }

    const available = getAllCommands()
      .map((c) => `\`${c.label}\``)
      .join(", ");
    addEntry({
      id: nextId(),
      type: "assistant",
      content: `Unknown command: \`${cmdLabel}\`. Available: ${available}`,
    });
  }

  return (
    <Layout
      header={
        <Header
          providerName={provider.name}
          modelName={getActiveModel()}
          tokenUsage={tokenUsage}
          modelConfig={provider.modelConfig?.[getActiveModel()]}
        />
      }
      conversationPanel={<ConversationPanel entries={entries} />}
      previewPanel={<PreviewPanel entries={previewEntries} />}
      footer={<Footer statusText={statusText} onSubmit={handleSubmit} />}
      showPreview={showPreview}
    />
  );
}
