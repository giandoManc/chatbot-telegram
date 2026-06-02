import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function databaseUrl() {
  const url = new URL(env("DATABASE_URL"));

  if (url.hostname.endsWith(".render.com") && !url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl(),
  },
});
