import { Box, useStdout, Text } from "ink";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { theme } from "./theme.js";

const headerHeight = 3;
const footerHeight = 3;

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
  splitRatio = 0.72,
  showPreview = false,
}: LayoutProps) {
  const { stdout } = useStdout();
  const [rows, setRows] = useState(() => stdout.rows ?? 24);

  useEffect(() => {
    setRows(stdout.rows);
    function onResize() {
      setRows(stdout.rows);
    }
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return (
    <Box flexDirection="column" height={rows} overflow="hidden">
      <Box flexShrink={0}>{header}</Box>
      <Box flexGrow={1} flexBasis={0} flexDirection="row" overflow="hidden">
        <Box
          flexBasis={showPreview ? `${Math.round(splitRatio * 100)}%` : "100%"}
          flexShrink={0}
          overflow="hidden"
          minWidth={showPreview ? 40 : 0}
          height="100%"
        >
          {conversationPanel}
        </Box>
        {showPreview && (
          <>
            <Separator />
            <Box
              flexBasis={`${Math.round((1 - splitRatio) * 100)}%`}
              flexShrink={0}
              paddingX={1}
              overflow="hidden"
              minWidth={30}
            >
              {previewPanel}
            </Box>
          </>
        )}
      </Box>
      <Box flexShrink={0} alignSelf="flex-end" width="100%">
        {footer}
      </Box>
    </Box>
  );
}

function Separator() {
  const c = theme.colors;
  const { stdout } = useStdout();
  const rows = stdout.rows ?? 24;
  const bodyRows = rows - headerHeight - footerHeight;
  const line = "\u2502";

  const separatorLines = [];
  for (let i = 0; i < bodyRows; i++) {
    separatorLines.push(
      <Text key={`sep-${i}`} color={c.textDim}>
        {line}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" width={1} flexShrink={0} overflow="hidden">
      {separatorLines}
    </Box>
  );
}
