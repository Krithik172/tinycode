import { Box } from "ink";
import type { ReactNode } from "react";
import { theme } from "./theme.js";

interface LayoutProps {
  header: ReactNode;
  conversationPanel: ReactNode;
  previewPanel: ReactNode;
  footer: ReactNode;
  splitRatio?: number;
  showPreview?: boolean;
}

export function Layout({
  header,
  conversationPanel,
  previewPanel,
  footer,
  splitRatio = 0.65,
  showPreview = false,
}: LayoutProps) {
  const c = theme.colors;

  return (
    <Box flexDirection="column" height="100%">
      <Box flexShrink={0}>{header}</Box>
      <Box flexGrow={1} flexDirection="row" overflow="hidden">
        <Box
          flexBasis={showPreview ? `${Math.round(splitRatio * 100)}%` : "100%"}
          flexShrink={0}
          overflow="hidden"
          minWidth={showPreview ? 30 : undefined}
        >
          {conversationPanel}
        </Box>
        {showPreview && (
          <>
            <Box width={1} backgroundColor={c.border} />
            <Box
              flexBasis={`${Math.round((1 - splitRatio) * 100)}%`}
              flexShrink={0}
              paddingX={1}
              overflow="hidden"
            >
              {previewPanel}
            </Box>
          </>
        )}
      </Box>
      <Box flexShrink={0}>{footer}</Box>
    </Box>
  );
}
