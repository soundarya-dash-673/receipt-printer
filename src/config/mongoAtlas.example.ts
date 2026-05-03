/**
 * Copy this file to mongoAtlas.ts and fill in your values.
 * mongoAtlas.ts is gitignored — never commit real credentials.
 *
 * Steps:
 * 1. Atlas → App Services → Data API → enable + create API key
 * 2. Copy the Data API URL and API key below
 * 3. Set dataSource to your linked cluster name (often "Cluster0")
 */
export const mongoAtlasConfig = {
  /** e.g. https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1 */
  endpointBase: '',
  /** Data API key from Atlas */
  apiKey: '',
  dataSource: 'Cluster0',
  database: 'slipgo',
};

export const MONGO_COLLECTIONS = {
  users: 'users',
  menus: 'menus',
  dailyReports: 'daily_reports',
} as const;

export function isMongoConfigured(): boolean {
  return (
    mongoAtlasConfig.endpointBase.length > 10 &&
    mongoAtlasConfig.apiKey.length > 8 &&
    !!mongoAtlasConfig.dataSource &&
    !!mongoAtlasConfig.database
  );
}
