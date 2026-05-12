import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { Spinner } from "../components/spinner.js";

export interface PreviewEntry {
  id: string;
  toolName: string;
  label: string;
  content: string;
  status: "running" | "success" | "error";
}

interface PreviewPanelProps {
  entries: PreviewEntry[];
}

export function PreviewPanel({ entries }: PreviewPanelProps) {
  const c = theme.colors;

  return (
    <Box flexGrow={1} flexDirection="column" height="100%" paddingY={1}>
      <Text bold color={c.textDim}>
        Preview
      </Text>
      <Box flexGrow={1} flexDirection="column" marginTop={1}>
        {entries.length === 0 ? (
          <Text color={c.textMuted}>
            Tool output appears here
          </Text>
        ) : (
          entries.map((entry) => (
            <PreviewEntryCard key={entry.id} entry={entry} />
          ))
        )}
      </Box>
    </Box>
  );
}

function PreviewEntryCard({ entry }: { entry: PreviewEntry }) {
  const c = theme.colors;

  const statusIcon =
    entry.status === "running" ? (
      <Spinner />
    ) : entry.status === "success" ? (
      <Text color={c.success}>✓</Text>
    ) : (
      <Text color={c.error}>✗</Text>
    );

  const headerColor =
    entry.status === "running"
      ? c.warning
      : entry.status === "success"
        ? c.success
        : c.error;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={headerColor}>
          {statusIcon} {entry.toolName}
        </Text>
        <Text color={c.textDim}> {entry.label}</Text>
      </Box>
      {entry.content && (
        <Box marginLeft={2} marginTop={0}>
          <Text color={c.textDim}>{truncate(entry.content, 500)}</Text>
        </Box>
      )}
    </Box>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n… (truncated)";
}
