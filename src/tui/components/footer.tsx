import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { PromptInput } from "./prompt-input.js";

interface FooterProps {
  statusText: string;
  onSubmit: (value: string) => void;
}

export function Footer({ statusText, onSubmit }: FooterProps) {
  const c = theme.colors;

  return (
    <Box flexDirection="column" flexShrink={0}>
      <Box width="100%" height={1} backgroundColor={c.border} />
      <Box flexDirection="row" paddingX={1} backgroundColor={c.inputBg}>
        <Box flexGrow={1}>
          <PromptInput onSubmit={onSubmit} />
        </Box>
      </Box>
      <Box flexDirection="row" paddingX={1} minHeight={1}>
        <Box flexGrow={1}>
          <Text color={c.textMuted}>{statusText}</Text>
        </Box>
        <Box>
          <Text color={c.textMuted}>Ctrl+B preview · / commands · Esc quit</Text>
        </Box>
      </Box>
    </Box>
  );
}
