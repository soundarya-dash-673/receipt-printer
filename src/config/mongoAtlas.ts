/**
 * MongoDB Atlas Data API (HTTPS) — fill in after creating an Atlas cluster + App Services Data API.
 *
 * 1. Atlas → App Services → Data API → enable + create API key
 * 2. Copy the Data API URL (ends in .../endpoint/data/v1) and API key
 * 3. Set data source name (your linked cluster name in App Services, often Cluster0)
 * 4. Create database `slipgo` (or change `database` below). Collections are created on first write:
 *    - `users` — phone_normalized, display_phone, password_sha256, updatedAt
 *    - `menus` — owner_key, items[], updatedAt
 *    - `daily_reports` — owner_key, day (YYYY-MM-DD), order_count, total_revenue, avg_order_value, updatedAt
 *
 * Optional indexes (Atlas UI): unique phone_normalized on users; unique (owner_key) on menus;
 * unique (owner_key, day) on daily_reports.
 *
 * Security: embedding API keys in the app is convenient for POS / internal builds only.
 * For production, use a backend or App Services rules + authenticated users.
 */
export const mongoAtlasConfig = {
  /** e.g. https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1 */
  endpointBase: '',
  /** Data API key from Atlas (not the connection string password) */
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
