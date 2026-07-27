import { PrismaClient } from "@prisma/client"

/** Prisma client or interactive transaction client passed to import steps. */
export type DbClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

/** Write-phase import: ~100 nodes × several statements; allow headroom beyond Prisma's 5s default. */
export const IMPORT_TRANSACTION_TIMEOUT_MS = 120_000

export const IMPORT_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: IMPORT_TRANSACTION_TIMEOUT_MS,
} as const
