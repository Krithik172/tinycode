export interface ThemeColors {
  primary: string;
  primaryDim: string;
  primaryBright: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textDim: string;
  textMuted: string;
  userMessage: string;
  assistantMessage: string;
  toolCall: string;
  inputBg: string;
  statusBar: string;
  statusBarText: string;
  userMessageBg: string;
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

function detectDarkMode(): boolean {
  const term = process.env.TERM_PROGRAM ?? "";
  const colorterm = process.env.COLORTERM ?? "";
  const isVscode = term.includes("vscode");
  const isHyper = term === "Hyper";
  const isITerm = term === "iTerm.app";
  const isWindowsTerminal = term === "WindowsTerminal";
  const isModern = colorterm === "truecolor" || colorterm === "24bit";
  return isVscode || isHyper || isITerm || isWindowsTerminal || isModern || true;
}

const darkColors: ThemeColors = {
  primary: "#2DD4BF",
  primaryDim: "#14B8A6",
  primaryBright: "#5EEAD4",
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
  info: "#3B82F6",
  background: "#0C0F15",
  surface: "#161A22",
  surfaceAlt: "#1E2330",
  border: "#2A3140",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMuted: "#64748B",
  userMessage: "#94A3B8",
  assistantMessage: "#E2E8F0",
  toolCall: "#64748B",
  inputBg: "#191E2A",
  statusBar: "#0D9488",
  statusBarText: "#042F2E",
  userMessageBg: "#1A2744",
};

const lightColors: ThemeColors = {
  primary: "#0D9488",
  primaryDim: "#14B8A6",
  primaryBright: "#5EEAD4",
  success: "#16A34A",
  warning: "#CA8A04",
  error: "#DC2626",
  info: "#2563EB",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceAlt: "#F1F5F9",
  border: "#E2E8F0",
  text: "#0F172A",
  textDim: "#475569",
  textMuted: "#94A3B8",
  userMessage: "#475569",
  assistantMessage: "#0F172A",
  toolCall: "#94A3B8",
  inputBg: "#F1F5F9",
  statusBar: "#14B8A6",
  statusBarText: "#FFFFFF",
  userMessageBg: "#E8F0FE",
};

export const theme: Theme = {
  isDark: detectDarkMode(),
  colors: detectDarkMode() ? darkColors : lightColors,
};
