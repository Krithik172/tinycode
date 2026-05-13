interface ProviderEnvConfig {
  apiKeyEnvVar: string;
  displayName: string;
  keyUrl: string;
}

const PROVIDER_ENV: Record<string, ProviderEnvConfig> = {
  gemini: {
    apiKeyEnvVar: "GOOGLE_API_KEY",
    displayName: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  groq: {
    apiKeyEnvVar: "GROQ_API_KEY",
    displayName: "Groq",
    keyUrl: "https://console.groq.com/keys",
  },
};

export function validateConfig(providerId: string): void {
  const cfg = PROVIDER_ENV[providerId];
  if (!cfg) {
    throw new Error(
      `Unknown provider: "${providerId}". Available: ${Object.keys(PROVIDER_ENV).join(", ")}`
    );
  }

  const apiKey = process.env[cfg.apiKeyEnvVar];
  if (!apiKey) {
    throw new Error(
      `${cfg.displayName} API key not configured.\n` +
      `  Set ${cfg.apiKeyEnvVar}=your-key-here in .env or as an environment variable.\n` +
      `  Get a key at ${cfg.keyUrl}`
    );
  }
}

export function getApiKey(providerId: string): string {
  const cfg = PROVIDER_ENV[providerId];
  if (!cfg) throw new Error(`Unknown provider: "${providerId}"`);
  return process.env[cfg.apiKeyEnvVar] ?? "";
}
