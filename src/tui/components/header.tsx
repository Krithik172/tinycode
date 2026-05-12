import { Box, Text } from "ink";
import { theme } from "../theme.js";
import type { TokenUsage } from "../../session.js";
import type { ModelConfig } from "../../llm/types.js";

interface HeaderProps {
  providerName: string;
  modelName: string;
  tokenUsage: TokenUsage;
  modelConfig?: ModelConfig;
}

export function Header({
  providerName,
  modelName,
  tokenUsage,
  modelConfig,
}: HeaderProps) {
  const c = theme.colors;

  const pct =
    modelConfig && modelConfig.contextLimit > 0
      ? (tokenUsage.totalTokens / modelConfig.contextLimit) * 100
      : null;

  const cost =
    modelConfig
      ? (tokenUsage.inputTokens / 1_000_000) * modelConfig.inputPricePerM +
        (tokenUsage.outputTokens / 1_000_000) * modelConfig.outputPricePerM
      : null;

  return (
    <Box borderStyle="single" borderColor={c.border} paddingX={1}>
      <Box flexGrow={1}>
        <Text color={c.primary} bold>
          tinycode
        </Text>
        <Text color={c.textDim}> · </Text>
        <Text color={c.textDim}>
          {providerName}/{modelName}
        </Text>
      </Box>
      <Box>
        <Text color={c.textMuted}>
          Tokens Used: {formatCount(tokenUsage.totalTokens)}
          {pct !== null ? ` (${pct.toFixed(1)}%)` : ""}
          {cost !== null ? ` · $${formatCost(cost)}` : ""}
        </Text>
      </Box>
    </Box>
  );
}

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

function formatCost(n: number): string {
  if (n < 0.0001) return "<0.0001";
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  return n.toFixed(4);
}
