import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { StreamingText } from "../components/streaming-text.js";
import { Spinner } from "../components/spinner.js";
import { renderMarkdown } from "../utils/markdown.js";

export interface ConversationEntry {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  isStreaming?: boolean;
  toolName?: string;
  toolStatus?: "running" | "success" | "error";
  args?: string;
}

interface ConversationPanelProps {
  entries: ConversationEntry[];
}

export function ConversationPanel({ entries }: ConversationPanelProps) {
  const c = theme.colors;

  if (entries.length === 0) {
    return (
      <Box flexGrow={1} paddingX={1} paddingY={1}>
        <Text color={c.textMuted}>Ready — start a conversation</Text>
      </Box>
    );
  }

  return (
    <Box flexGrow={1} flexDirection="column" paddingX={1} paddingY={1} overflowY="hidden">
      {entries.map((entry) => (
        <ConversationBubble key={entry.id} entry={entry} />
      ))}
    </Box>
  );
}

function ConversationBubble({ entry }: { entry: ConversationEntry }) {
  const c = theme.colors;

  switch (entry.type) {
    case "user":
      return (
        <Box>
          <Text color={c.textDim}>  </Text>
          <Text color={c.userMessage}>{entry.content}</Text>
        </Box>
      );

    case "assistant":
      return (
        <Box flexDirection="column">
          {entry.isStreaming ? (
            <StreamingText
              text={entry.content}
              isStreaming={true}
              messageId={entry.id}
              color={c.assistantMessage}
            />
          ) : entry.content ? (
            renderMarkdown(entry.content, c.assistantMessage)
          ) : null}
        </Box>
      );

    case "tool":
      return (
        <Box>
          <Text color={c.toolCall}>
            {"  "}
            {entry.toolStatus === "running" ? (
              <Spinner />
            ) : entry.toolStatus === "success" ? (
              <Text color={c.success}>✓</Text>
            ) : entry.toolStatus === "error" ? (
              <Text color={c.error}>✗</Text>
            ) : (
              <Text color={c.textMuted}>·</Text>
            )}
            {" "}
            <Text dimColor>{entry.toolName}</Text>
            {entry.args ? (
              <Text dimColor>{` ${entry.args.slice(0, 60)}${entry.args.length > 60 ? "..." : ""}`}</Text>
            ) : null}
          </Text>
        </Box>
      );
  }
}
