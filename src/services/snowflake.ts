import snowflake from "snowflake-sdk";

// Connection pool or singleton
let connection: snowflake.Connection | null = null;

export async function getSnowflakeConnection(): Promise<snowflake.Connection> {
  if (connection && connection.isUp()) {
    return connection;
  }

  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const database = process.env.SNOWFLAKE_DATABASE || "PHISHGRAPH_DB";
  const schema = process.env.SNOWFLAKE_SCHEMA || "RAW";
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
  const role = process.env.SNOWFLAKE_ROLE;

  if (!account || !username || !password) {
    throw new Error("Missing Snowflake credentials (SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD)");
  }

  connection = snowflake.createConnection({
    account,
    username,
    password,
    database,
    schema,
    warehouse,
    role,
    application: "PhishGraph",
  });

  return new Promise((resolve, reject) => {
    connection!.connect((err, conn) => {
      if (err) {
        console.error("Snowflake connection failed:", err.message);
        reject(err);
      } else {
        console.log("Successfully connected to Snowflake.");
        resolve(conn);
      }
    });
  });
}

export async function executeSql<T = any>(sqlText: string, binds?: any[]): Promise<T[]> {
  const conn = await getSnowflakeConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error(`SQL error: ${err.message}\nQuery: ${sqlText}`);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      },
    });
  });
}
