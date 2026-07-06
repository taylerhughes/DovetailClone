import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isRds = process.env.DATABASE_URL?.includes("rds.amazonaws.com");
const rdsCaPath = path.join(process.cwd(), "certs/rds-ca-bundle.pem");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: isRds
    ? { ca: fs.readFileSync(rdsCaPath).toString() }
    : undefined,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
