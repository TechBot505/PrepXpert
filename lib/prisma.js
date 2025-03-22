import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// globalThis.prisma: This is a global variable that we use to store the PrismaClient instance. This is useful because we can reuse the same instance across multiple requests in development. This is not recommended in production because it can lead to memory leaks.
// This is resued across hot reloads in development, so we don't have to create a new instance of PrismaClient for every request.