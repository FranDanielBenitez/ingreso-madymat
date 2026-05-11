import sql from "mssql"

const sqlServerConfig = {
  server: process.env.SQLSERVER_HOST,
  port: Number(process.env.SQLSERVER_PORT || 1433),
  database: process.env.SQLSERVER_DATABASE,
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let poolPromise = null

export async function getSqlServerPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlServerConfig)
  }

  return poolPromise
}

export { sql }