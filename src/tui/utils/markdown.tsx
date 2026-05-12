import { Text } from "ink";
import type { ReactNode } from "react";

interface InlinePart {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push({ text: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/[`*]/);
    if (nextSpecial === -1) {
      parts.push({ text: remaining });
      remaining = "";
    } else if (nextSpecial === 0) {
      parts.push({ text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      parts.push({ text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

function renderInline(parts: InlinePart[]): ReactNode {
  return parts.map((part, i) => {
    if (part.code) {
      return (
        <Text key={i} color="yellow" dimColor={false}>
          {part.text}
        </Text>
      );
    }
    let node: ReactNode = part.text;
    if (part.bold) node = <Text bold>{node}</Text>;
    if (part.italic) node = <Text italic>{node}</Text>;
    return <Text key={i}>{node}</Text>;
  });
}

export function renderMarkdown(text: string, color?: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let paragraph = "";

  function flushParagraph() {
    if (!paragraph.trim()) return;
    const trimmed = paragraph.trim();
    nodes.push(
      <Text key={nodes.length} color={color}>{renderInline(parseInline(trimmed))}</Text>,
    );
    paragraph = "";
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        nodes.push(
          <Text key={nodes.length} color="yellow" dimColor={false}>
            {codeContent}
          </Text>,
        );
        codeContent = "";
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line;
      continue;
    }

    if (line.startsWith("#")) {
      flushParagraph();
      const content = line.replace(/^#+\s*/, "");
      nodes.push(
        <Text key={nodes.length} bold color={color}>
          {renderInline(parseInline(content))}
        </Text>,
      );
      continue;
    }

    if (line.match(/^\s*[-*]\s/)) {
      flushParagraph();
      const content = line.replace(/^\s*[-*]\s/, "");
      nodes.push(
        <Text key={nodes.length} color={color}>
          {"  "}• {renderInline(parseInline(content))}
        </Text>,
      );
      continue;
    }

    if (line.match(/^\s*\d+\.\s/)) {
      flushParagraph();
      const content = line.replace(/^\s*\d+\.\s/, "");
      nodes.push(
        <Text key={nodes.length} color={color}>
          {"  "}• {renderInline(parseInline(content))}
        </Text>,
      );
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      nodes.push(<Text key={`sp${nodes.length}`}>{" "}</Text>);
      continue;
    }

    paragraph += (paragraph ? "\n" : "") + line;
  }

  flushParagraph();

  if (inCodeBlock) {
    nodes.push(
      <Text key={nodes.length} color="yellow" dimColor={false}>
        {codeContent}
      </Text>,
    );
  }

  return nodes;
}
