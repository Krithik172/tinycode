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
    <Box borderStyle="bold" borderColor={c.primary} paddingX={1} backgroundColor={c.inputBg}>
      <Box flexDirection="column" width="100%">
        <Box flexGrow={1}>
          <PromptInput onSubmit={onSubmit} />
        </Box>
        <Box width="100%" marginTop={1}>
          <Box flexGrow={1}>
            <Text color={c.textMuted}>{statusText}</Text>
          </Box>
          <Box>
            <Text color={c.textMuted}>Ctrl+B preview</Text>
            <Text color={c.textMuted}> · </Text>
            <Text color={c.textMuted}>/ commands</Text>
            <Text color={c.textMuted}> · </Text>
            <Text color={c.textMuted}>Esc quit</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
