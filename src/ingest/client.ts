import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create an Anthropic client that works with both standard API keys
 * and OAuth tokens (sk-ant-oat01-*).
 * 
 * Priority:
 * 1. ANTHROPIC_API_KEY env var (standard API key)
 * 2. OAuth token from OpenClaw auth profiles
 */
export function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // If standard API key is set, use it normally
  if (apiKey && !apiKey.startsWith('sk-ant-oat')) {
    return new Anthropic({ apiKey });
  }

  // Try OAuth token (from env or auth profiles)
  const oauthToken = apiKey?.startsWith('sk-ant-oat') 
    ? apiKey 
    : loadOAuthToken();

  if (oauthToken) {
    return new Anthropic({
      apiKey: '', // must be empty string, not null
      authToken: oauthToken,
      defaultHeaders: {
        'anthropic-beta': 'claude-code-20250219,oauth-2025-04-20',
        'user-agent': 'claude-cli/2.1.62',
        'x-app': 'cli',
      },
    });
  }

  // Fallback: let Anthropic SDK handle it (will error if no key)
  return new Anthropic();
}

function loadOAuthToken(): string | undefined {
  const profilePaths = [
    path.join(process.env.HOME ?? '', '.openclaw/agents/main/agent/auth-profiles.json'),
  ];

  for (const p of profilePaths) {
    try {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const profile = data.profiles?.['anthropic:default'];
        if (profile?.token?.startsWith('sk-ant-oat')) {
          return profile.token;
        }
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}
