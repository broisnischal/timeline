import "@tanstack/react-start/server-only";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";

type NotionTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string | null;
  bot_id?: string | null;
  workspace_name?: string | null;
  workspace_icon?: string | null;
  workspace_id: string;
};

export type NotionPageLite = {
  id: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
};

export type NotionPropertyConfig = {
  id: string;
  name: string;
  type: string;
  statusOptions?: string[];
  selectOptions?: string[];
};

export function getNotionAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const u = new URL("https://api.notion.com/v1/oauth/authorize");
  u.searchParams.set("client_id", input.clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("owner", "user");
  u.searchParams.set("redirect_uri", input.redirectUri);
  u.searchParams.set("state", input.state);
  return u.toString();
}

export async function exchangeNotionOAuthCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  const basic = Buffer.from(`${input.clientId}:${input.clientSecret}`).toString("base64");
  const res = await fetch(`${NOTION_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion OAuth exchange failed (${res.status}): ${body}`);
  }
  return (await res.json()) as NotionTokenResponse;
}

async function notionRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit & { bodyJson?: unknown },
) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(init?.headers ?? {}),
    },
    body: init?.bodyJson !== undefined ? JSON.stringify(init.bodyJson) : init?.body,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API failed (${res.status}) on ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

async function retrieveDataSourceSchemaById(input: { accessToken: string; id: string }) {
  try {
    return await notionRequest<{
      properties?: Record<
        string,
        {
          id?: string;
          type?: string;
          status?: { options?: Array<{ name?: string }> };
          select?: { options?: Array<{ name?: string }> };
        }
      >;
    }>(`/databases/${input.id}`, input.accessToken, { method: "GET" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("object_not_found")) throw err;
    return notionRequest<{
      properties?: Record<
        string,
        {
          id?: string;
          type?: string;
          status?: { options?: Array<{ name?: string }> };
          select?: { options?: Array<{ name?: string }> };
        }
      >;
    }>(`/data_sources/${input.id}`, input.accessToken, { method: "GET" });
  }
}

async function notionRequestWithDataSourceFallback<T>(input: {
  accessToken: string;
  id: string;
  method: "POST";
  bodyJson?: unknown;
}) {
  try {
    return await notionRequest<T>(`/databases/${input.id}/query`, input.accessToken, {
      method: input.method,
      bodyJson: input.bodyJson,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Notion can expose modern "data source" IDs; retry with that endpoint.
    if (!msg.includes("object_not_found")) throw err;
    return notionRequest<T>(`/data_sources/${input.id}/query`, input.accessToken, {
      method: input.method,
      bodyJson: input.bodyJson,
    });
  }
}

type QueryDatabaseResponse = {
  has_more: boolean;
  next_cursor: string | null;
  results: NotionPageLite[];
};

export async function queryNotionDatabaseAll(input: {
  accessToken: string;
  databaseId: string;
  lastEditedAfter?: string | undefined;
}) {
  const results: NotionPageLite[] = [];
  let cursor: string | undefined;
  for (;;) {
    const body: Record<string, unknown> = {
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;
    if (input.lastEditedAfter) {
      body.filter = {
        timestamp: "last_edited_time",
        last_edited_time: {
          after: input.lastEditedAfter,
        },
      };
    }
    const page = await notionRequestWithDataSourceFallback<QueryDatabaseResponse>({
      accessToken: input.accessToken,
      id: input.databaseId,
      method: "POST",
      bodyJson: body,
    });
    results.push(...page.results);
    if (!page.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
  }
  return results;
}

export async function createNotionPage(input: {
  accessToken: string;
  databaseId: string;
  properties: Record<string, unknown>;
}) {
  try {
    return await notionRequest<{ id: string; last_edited_time: string }>(
      `/pages`,
      input.accessToken,
      {
        method: "POST",
        bodyJson: {
          parent: { database_id: input.databaseId },
          properties: input.properties,
        },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("object_not_found")) throw err;
    return notionRequest<{ id: string; last_edited_time: string }>(`/pages`, input.accessToken, {
      method: "POST",
      bodyJson: {
        parent: { type: "data_source_id", data_source_id: input.databaseId },
        properties: input.properties,
      },
    });
  }
}

export async function updateNotionPage(input: {
  accessToken: string;
  pageId: string;
  properties: Record<string, unknown>;
}) {
  return notionRequest<{ id: string; last_edited_time: string }>(
    `/pages/${input.pageId}`,
    input.accessToken,
    {
      method: "PATCH",
      bodyJson: { properties: input.properties },
    },
  );
}

export async function getNotionDataSchema(input: { accessToken: string; databaseId: string }) {
  const data = await retrieveDataSourceSchemaById({
    accessToken: input.accessToken,
    id: input.databaseId,
  });
  const props = data.properties ?? {};
  const out: Record<string, NotionPropertyConfig> = {};
  for (const [name, p] of Object.entries(props)) {
    out[name] = {
      id: p.id ?? name,
      name,
      type: p.type ?? "unknown",
      statusOptions: p.status?.options?.map((o) => o.name ?? "").filter(Boolean),
      selectOptions: p.select?.options?.map((o) => o.name ?? "").filter(Boolean),
    };
  }
  return out;
}
