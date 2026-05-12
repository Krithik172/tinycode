import { Text } from "ink";
import { useEffect, useState, useRef } from "react";
import { renderMarkdown } from "../utils/markdown.js";
interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  messageId: string;
  color?: string;
}

export function StreamingText({
  text,
  isStreaming,
  messageId,
  color,
}: StreamingTextProps) {
  const [displayLen, setDisplayLen] = useState(0);
  const prevIdRef = useRef(messageId);

  if (messageId !== prevIdRef.current) {
    prevIdRef.current = messageId;
    setDisplayLen(0);
  }

  useEffect(() => {
    if (!isStreaming) {
      setDisplayLen(text.length);
      return;
    }
    if (displayLen >= text.length) return;

    const timer = setInterval(() => {
      setDisplayLen((prev) => {
        if (prev >= text.length) return prev;
        return prev + 1;
      });
    }, 15);

    return () => clearInterval(timer);
  }, [text, isStreaming, displayLen]);

  const visible = text.slice(0, displayLen);
  const isComplete = displayLen >= text.length;

  const rendered = renderMarkdown(visible, color);

  return (
    <>
      {rendered}
      {isStreaming && !isComplete && <Text color="yellow">▊</Text>}
    </>
  );
}
