import { Box, Text } from "ink";
import { theme } from "../theme.js";

export interface MenuItem {
  label: string;
  value?: string;
  description?: string;
  isActive?: boolean;
}

interface CommandMenuProps {
  items: MenuItem[];
  selectedIndex: number;
  title?: string;
  maxVisible?: number;
}

export function CommandMenu({
  items,
  selectedIndex,
  title,
  maxVisible = 8,
}: CommandMenuProps) {
  const c = theme.colors;

  if (items.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={c.border}
        paddingX={1}
        paddingY={1}
        marginBottom={1}
        width="100%"
      >
        {title ? (
          <Box>
            <Text color={c.textMuted}>{title}</Text>
          </Box>
        ) : null}
        <Box>
          <Text color={c.textMuted}>No matching commands</Text>
        </Box>
      </Box>
    );
  }

  const start = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(maxVisible / 2), items.length - maxVisible),
  );
  const visibleItems = items.slice(start, start + maxVisible);
  const offset = start;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={c.border}
      paddingX={1}
      paddingY={0}
      marginBottom={1}
      width="100%"
    >
      {title ? (
        <Box>
          <Text color={c.textMuted}>{title}</Text>
        </Box>
      ) : null}
      {visibleItems.map((item, i) => {
        const actualIndex = offset + i;
        const isSelected = actualIndex === selectedIndex;
        return (
          <Box key={item.value ?? item.label} flexDirection="row">
            <Text>
              {isSelected ? (
                <Text color={c.primaryBright}>▸ </Text>
              ) : (
                <Text>  </Text>
              )}
              {isSelected ? (
                <Text color={c.primary} bold>
                  {item.label}
                </Text>
              ) : item.isActive ? (
                <Text color={c.success}>{item.label} ◄</Text>
              ) : (
                <Text color={c.text}>{item.label}</Text>
              )}
              {item.description ? (
                <Text color={c.textMuted}>  {item.description}</Text>
              ) : null}
            </Text>
          </Box>
        );
      })}
      {items.length > maxVisible ? (
        <Box>
          <Text color={c.textMuted}>
            {start > 0 ? "↑ " : ""}
            {start + maxVisible < items.length
              ? `${items.length - start - maxVisible} more ↓`
              : ""}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
