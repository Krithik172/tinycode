import { Box, Text, useInput } from "ink";
import { useState, useMemo } from "react";
import { theme } from "../theme.js";
import { CommandMenu, type MenuItem } from "./command-menu.js";
import { getAllCommands, type CommandDefinition } from "../commands.js";

interface PromptInputProps {
  onSubmit: (value: string) => void;
}

type Mode = "text" | "command";
type MenuLevel = "root" | "sub";

export function PromptInput({ onSubmit }: PromptInputProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [mode, setMode] = useState<Mode>("text");
  const [menuLevel, setMenuLevel] = useState<MenuLevel>("root");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submenuItems, setSubmenuItems] = useState<MenuItem[]>([]);
  const [activeCommand, setActiveCommand] = useState<CommandDefinition | null>(
    null,
  );
  const c = theme.colors;

  const allCommands = getAllCommands();
  const filterText =
    mode === "command" && menuLevel === "root"
      ? value.startsWith("/")
        ? value.slice(1)
        : ""
      : "";

  const filteredCommands = useMemo(
    () =>
      allCommands.filter((cmd) =>
        cmd.label.toLowerCase().startsWith("/" + filterText.toLowerCase()),
      ),
    [allCommands, filterText],
  );

  useInput((char, key) => {
    if (key.escape) {
      if (mode === "command") {
        if (menuLevel === "sub") {
          setMenuLevel("root");
          setSelectedIndex(0);
          setActiveCommand(null);
        } else {
          setMode("text");
          setValue("");
          setSelectedIndex(0);
        }
      }
      return;
    }

    if (mode === "command") {
      if (menuLevel === "root") {
        if (key.upArrow) {
          setSelectedIndex((prev) =>
            filteredCommands.length > 0
              ? (prev - 1 + filteredCommands.length) % filteredCommands.length
              : 0,
          );
          return;
        }

        if (key.downArrow) {
          setSelectedIndex((prev) =>
            filteredCommands.length > 0
              ? (prev + 1) % filteredCommands.length
              : 0,
          );
          return;
        }

        if (key.return && !key.shift) {
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            if (selected.hasSubmenu) {
              setActiveCommand(selected);
              const items = selected.getSubmenuItems?.() ?? [];
              setSubmenuItems(items);
              setMenuLevel("sub");
              setSelectedIndex(0);
            } else {
              const cmd = selected.label;
              setMode("text");
              setValue("");
              setSelectedIndex(0);
              setHistory((prev) => [...prev, cmd]);
              onSubmit(cmd);
            }
          }
          return;
        }

        if (key.backspace || key.delete) {
          if (value.length > 1) {
            setValue((prev) => prev.slice(0, -1));
          } else {
            setMode("text");
            setValue("");
            setSelectedIndex(0);
          }
          return;
        }

        if (key.ctrl) return;

        if (char) {
          setValue((prev) => prev + char);
          setSelectedIndex(0);
          return;
        }
      } else if (menuLevel === "sub") {
        if (key.upArrow) {
          setSelectedIndex((prev) =>
            submenuItems.length > 0
              ? (prev - 1 + submenuItems.length) % submenuItems.length
              : 0,
          );
          return;
        }

        if (key.downArrow) {
          setSelectedIndex((prev) =>
            submenuItems.length > 0
              ? (prev + 1) % submenuItems.length
              : 0,
          );
          return;
        }

        if (key.return && !key.shift) {
          const selected = submenuItems[selectedIndex];
          if (selected && activeCommand) {
            const cmd = `${activeCommand.label} ${selected.value}`;
            setMode("text");
            setValue("");
            setSelectedIndex(0);
            setMenuLevel("root");
            setActiveCommand(null);
            setSubmenuItems([]);
            setHistory((prev) => [...prev, cmd]);
            onSubmit(cmd);
          }
          return;
        }

        return;
      }
      return;
    }

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
      if (value === "" && char === "/") {
        setMode("command");
        setMenuLevel("root");
        setSelectedIndex(0);
        setValue("/");
        return;
      }
      setValue((prev) => prev + char);
    }
  });

  const displayText = (() => {
    if (mode === "command") {
      if (menuLevel === "sub") {
        return `${activeCommand?.label ?? ""} `;
      }
      return value;
    }
    return value || "type a message...";
  })();

  const isPlaceholder = value.length === 0 && mode === "text";

  return (
    <Box flexDirection="column" width="100%">
      {mode === "command" && menuLevel === "root" ? (
        <CommandMenu
          items={filteredCommands.map((cmd) => ({
            label: cmd.label,
            value: cmd.id,
            description: cmd.description,
          }))}
          selectedIndex={selectedIndex}
          maxVisible={6}
        />
      ) : null}
      {mode === "command" && menuLevel === "sub" ? (
        <CommandMenu
          items={submenuItems}
          selectedIndex={selectedIndex}
          title={activeCommand?.label ?? ""}
          maxVisible={6}
        />
      ) : null}
      <Box flexDirection="row" width="100%">
        <Text color={c.primary} bold>
          {">"}
        </Text>
        <Text> </Text>
        <Text color={isPlaceholder ? c.textMuted : c.text}>{displayText}</Text>
        <Text color={c.primaryDim}>█</Text>
      </Box>
    </Box>
  );
}
