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

  async function handleCommand(value: string) {
    const cmd = value.split(/\s+/);
    const command = cmd[0].toLowerCase();

    switch (command) {
      case "/quit":
      case "/exit":
        exit();
        break;

      case "/clear":
      case "/new":
        setEntries([]);
        setPreviewEntries([]);
        setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
        setShowPreview(false);
        setStatusText("Ready");
        sessionRef.current = new Session();
        break;

      case "/connect":
        if (cmd.length >= 2) {
          const name = cmd[1];
          try {
            setActive(name);
            forceRender();
            setStatusText("Ready");
            addEntry({
              id: nextId(),
              type: "assistant",
              content: `Switched to provider: **${name}**`,
            });
          } catch (e) {
            addEntry({
              id: nextId(),
              type: "assistant",
              content: `Error: ${(e as Error).message}`,
            });
          }
        } else {
          const providers = list();
          const msg = providers
            .map(
              (p, i) =>
                `${i + 1}. **${p.name}** — models: ${p.models.join(", ")}`,
            )
            .join("\n");
          addEntry({
            id: nextId(),
            type: "assistant",
            content: `Available providers:\n${msg}\n\nType \`/connect <name>\` to switch.`,
          });
          setStatusText("Ready");
        }
        break;

      case "/model":
        if (cmd.length >= 2) {
          const modelName = cmd[1];
          try {
            setActiveModel(modelName);
            forceRender();
            setStatusText("Ready");
            addEntry({
              id: nextId(),
              type: "assistant",
              content: `Switched to model: **${modelName}**`,
            });
          } catch (e) {
            addEntry({
              id: nextId(),
              type: "assistant",
              content: `Error: ${(e as Error).message}`,
            });
          }
        } else {
          const provider = getActive();
          const msg = provider.models
            .map(
              (m, i) =>
                `${i + 1}. **${m}**${m === getActiveModel() ? " (active)" : ""}`,
            )
            .join("\n");
          addEntry({
            id: nextId(),
            type: "assistant",
            content: `Available models for **${provider.name}**:\n${msg}\n\nType \`/model <name>\` to switch.`,
          });
          setStatusText("Ready");
        }
        break;

      default:
        addEntry({
          id: nextId(),
          type: "assistant",
          content: `Unknown command: \`${command}\`. Available: \`/quit\`, \`/clear\`, \`/new\`, \`/connect\`, \`/model\``,
        });
        break;
    }
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
