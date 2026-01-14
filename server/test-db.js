const { Client } = require("pg");
const client = new Client({
  connectionString: "postgres://postgres.ugrepmqlakoeobiadfiv:Bharani%401985@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => { console.log("SUCCESS"); process.exit(0); })
  .catch(err => { console.error("FAILURE", err.message); process.exit(1); });
