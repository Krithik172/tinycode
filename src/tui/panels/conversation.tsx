import { Box, Text, useStdout, useInput } from "ink";
import { useState, useEffect } from "react";
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
  const { stdout } = useStdout();
  const HEADER_HEIGHT = 2;
  const FOOTER_HEIGHT = 3;
  const panelHeight = Math.max(1, stdout.rows - HEADER_HEIGHT - FOOTER_HEIGHT);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom) {
      setScrollOffset(0);
    }
  }, [entries.length]);

  useInput((_input, key) => {
    if (key.pageUp) {
      setScrollOffset((prev) => prev + Math.floor(panelHeight / 2));
      setIsAtBottom(false);
    }
    if (key.pageDown) {
      const next = Math.max(0, scrollOffset - Math.floor(panelHeight / 2));
      setScrollOffset(next);
      if (next === 0) setIsAtBottom(true);
    }
  });

  if (entries.length === 0) {
    return (
      <Box height={panelHeight} paddingX={1} paddingY={1}>
        <Text color={c.textMuted}>Ready — start a conversation</Text>
      </Box>
    );
  }

  return (
    <Box height={panelHeight} flexDirection="column" paddingX={1} paddingY={1} overflowY="hidden">
      <Box
        flexDirection="column"
        justifyContent={isAtBottom ? "flex-end" : "flex-start"}
        marginTop={isAtBottom ? 0 : scrollOffset}
        flexGrow={1}
      >
        {entries.map((entry) => (
          <ConversationBubble key={entry.id} entry={entry} />
        ))}
      </Box>
    </Box>
  );
}

function ConversationBubble({ entry }: { entry: ConversationEntry }) {
  const c = theme.colors;

  switch (entry.type) {
    case "user":
      return (
        <Box width="100%" justifyContent="flex-end" marginBottom={1}>
          <Box
            backgroundColor={c.userMessageBg}
            paddingX={1}
            paddingY={0}
          >
            <Text color={c.text}>{entry.content}</Text>
          </Box>
        </Box>
      );

    case "assistant":
      return (
        <Box flexDirection="column" marginBottom={1}>
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
        <Box marginBottom={1}>
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
