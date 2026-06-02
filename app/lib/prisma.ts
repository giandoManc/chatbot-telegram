import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const databaseUrl = new URL(connectionString);
const shouldUseSsl =
  databaseUrl.searchParams.get("sslmode") === "require" ||
  databaseUrl.hostname.endsWith(".render.com");

const adapter = new PrismaPg({
  connectionString,
  ssl: shouldUseSsl,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
