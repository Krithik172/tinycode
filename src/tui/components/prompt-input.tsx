import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { theme } from "../theme.js";

interface PromptInputProps {
  onSubmit: (value: string) => void;
  isActive: boolean;
}

export function PromptInput({ onSubmit, isActive }: PromptInputProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const c = theme.colors;

  useInput((char, key) => {
    if (!isActive) return;
    if (key.escape) return;

    if (key.return && !key.shift) {
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
        setHistory((prev) => [...prev, trimmed]);
      }
      setValue("");
      setHistoryIdx(-1);
      return;
    }

    if (key.return && key.shift) {
      setValue((prev) => prev + "\n");
      return;
    }

    if (key.backspace || key.delete) {
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    if (key.upArrow) {
      if (historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setValue(history[history.length - 1 - newIdx]);
      }
      return;
    }

    if (key.downArrow) {
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setValue(history[history.length - 1 - newIdx]);
      } else {
        setHistoryIdx(-1);
        setValue("");
      }
      return;
    }

    if (key.ctrl) return;

    if (char) {
      setValue((prev) => prev + char);
    }
  });

  const lines = value.split("\n");
  const isEmpty = value.length === 0;
  const cursor = isActive ? (
    <Text color={c.primaryDim}>█</Text>
  ) : (
    <Text color={c.textMuted}>▯</Text>
  );

  return (
    <Box flexDirection="column" width="100%">
      {isEmpty ? (
        <Box flexDirection="row">
          <Text color={c.primary} bold>{">"}</Text>
          <Text> </Text>
          <Text color={c.textMuted}>type a message...</Text>
          {cursor}
        </Box>
      ) : (
        lines.map((line, i) => (
          <Box key={i} flexDirection="row">
            <Text color={c.primary} bold>{i === 0 ? ">" : " "}</Text>
            <Text> </Text>
            <Text color={c.text}>{line}</Text>
            {i === lines.length - 1 && cursor}
          </Box>
        ))
      )}
    </Box>
  );
}
