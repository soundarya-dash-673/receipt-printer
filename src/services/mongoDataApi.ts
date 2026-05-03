import {isMongoConfigured, mongoAtlasConfig} from '../config/mongoAtlas';

type DataApiResponse = {insertedId?: string} | {matchedCount?: number; modifiedCount?: number} | {documents?: unknown[]};

/**
 * Calls MongoDB Atlas Data API v1: POST {endpointBase}/action/{actionName}
 * @see https://www.mongodb.com/docs/atlas/api/data-api/
 */
export async function mongoDataApiAction<T = DataApiResponse>(
  actionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isMongoConfigured()) {
    throw new Error('MongoDB Data API is not configured');
  }
  const url = `${mongoAtlasConfig.endpointBase.replace(/\/$/, '')}/action/${actionName}`;
  const body = {
    dataSource: mongoAtlasConfig.dataSource,
    database: mongoAtlasConfig.database,
    ...payload,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': mongoAtlasConfig.apiKey,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Mongo Data API ${actionName}: ${res.status} ${text}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Mongo Data API ${actionName}: invalid JSON ${text.slice(0, 200)}`);
  }
}
