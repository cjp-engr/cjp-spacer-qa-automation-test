import { APIRequestContext } from '@playwright/test';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  created_at: number;
}

export async function getAccessToken(
  request: APIRequestContext
): Promise<string> {
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      'Missing OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, or OAUTH_CLIENT_SECRET environment variable.'
    );
  }

  const response = await request.post(tokenUrl, {
    headers: {
      'Content-Type': 'application/json',
    },

    data: {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
  });

  if (response.status() !== 200) {
    throw new Error(
      `Token request failed with status ${response.status()}: ${await response.text()}`
    );
  }

  const body: OAuthTokenResponse = await response.json();

  if (!body.access_token) {
    throw new Error(
      `Token response did not include an access_token: ${JSON.stringify(body)}`
    );
  }

  return body.access_token;
}