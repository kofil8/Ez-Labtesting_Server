import prisma from '../../shared/prisma';

type BeginProcessingResult =
  | { state: 'process' }
  | { state: 'already_processed' }
  | { state: 'in_progress' };

const PROVIDER = 'stripe';

type ListWebhookEventsParams = {
  provider?: string;
  status?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
};

class WebhookEventLedgerService {
  async beginProcessing(eventId: string, eventType: string): Promise<BeginProcessingResult> {
    const inserted = await prisma.$executeRawUnsafe(
      `
      INSERT INTO "WebhookEvent" (
        "id", "provider", "externalEventId", "eventType", "status", "attemptCount", "createdAt", "updatedAt"
      )
      VALUES (md5(random()::text || clock_timestamp()::text), $1, $2, $3, 'PROCESSING', 1, NOW(), NOW())
      ON CONFLICT ("provider", "externalEventId") DO NOTHING
      `,
      PROVIDER,
      eventId,
      eventType,
    );

    if (Number(inserted) > 0) {
      return { state: 'process' };
    }

    const rows = await prisma.$queryRawUnsafe<Array<{ status: string; attemptCount: number }>>(
      `
      SELECT "status", "attemptCount"
      FROM "WebhookEvent"
      WHERE "provider" = $1 AND "externalEventId" = $2
      LIMIT 1
      `,
      PROVIDER,
      eventId,
    );

    const existing = rows[0];
    if (!existing) return { state: 'process' };

    if (existing.status === 'COMPLETE') return { state: 'already_processed' };

    // Allow a retry when previous processing failed.
    if (existing.status === 'FAILED') {
      await prisma.$executeRawUnsafe(
        `
        UPDATE "WebhookEvent"
        SET "status" = 'PROCESSING',
            "attemptCount" = "attemptCount" + 1,
            "updatedAt" = NOW(),
            "lastError" = NULL
        WHERE "provider" = $1 AND "externalEventId" = $2
        `,
        PROVIDER,
        eventId,
      );
      return { state: 'process' };
    }

    // PROCESSING means another worker/request is handling it now.
    return { state: 'in_progress' };
  }

  async markProcessed(eventId: string) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE "WebhookEvent"
      SET "status" = 'COMPLETE',
          "processedAt" = NOW(),
          "updatedAt" = NOW(),
          "lastError" = NULL
      WHERE "provider" = $1 AND "externalEventId" = $2
      `,
      PROVIDER,
      eventId,
    );
  }

  async markFailed(eventId: string, errorMessage: string) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE "WebhookEvent"
      SET "status" = 'FAILED',
          "updatedAt" = NOW(),
          "lastError" = $3
      WHERE "provider" = $1 AND "externalEventId" = $2
      `,
      PROVIDER,
      eventId,
      errorMessage.slice(0, 2000),
    );
  }

  async listEvents(params: ListWebhookEventsParams = {}) {
    const provider = (params.provider || PROVIDER).toLowerCase();
    const status = params.status?.toUpperCase();
    const eventType = params.eventType;
    const limit = Math.max(1, Math.min(200, Number(params.limit) || 50));
    const offset = Math.max(0, Number(params.offset) || 0);

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        provider: string;
        externalEventId: string;
        eventType: string;
        status: string;
        attemptCount: number;
        lastError: string | null;
        processedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `
      SELECT
        "id",
        "provider",
        "externalEventId",
        "eventType",
        "status",
        "attemptCount",
        "lastError",
        "processedAt",
        "createdAt",
        "updatedAt"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND ($2::text IS NULL OR "status" = $2)
        AND ($3::text IS NULL OR "eventType" = $3)
      ORDER BY "createdAt" DESC
      LIMIT $4 OFFSET $5
      `,
      provider,
      status || null,
      eventType || null,
      limit,
      offset,
    );

    const totalRows = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      `
      SELECT COUNT(*)::text as "count"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND ($2::text IS NULL OR "status" = $2)
        AND ($3::text IS NULL OR "eventType" = $3)
      `,
      provider,
      status || null,
      eventType || null,
    );

    return {
      items: rows,
      total: Number(totalRows[0]?.count || 0),
      limit,
      offset,
    };
  }

  async getStatusSummary(params: { provider?: string; lookbackHours?: number } = {}) {
    const provider = (params.provider || PROVIDER).toLowerCase();
    const lookbackHours = Math.max(1, Math.min(24 * 30, Number(params.lookbackHours) || 24));

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        status: string;
        count: string;
      }>
    >(
      `
      SELECT "status", COUNT(*)::text as "count"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND "createdAt" >= NOW() - (($2::text || ' hours')::interval)
      GROUP BY "status"
      `,
      provider,
      lookbackHours,
    );

    const staleRows = await prisma.$queryRawUnsafe<Array<{ count: string }>>(
      `
      SELECT COUNT(*)::text as "count"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND "status" = 'PROCESSING'
        AND "updatedAt" < NOW() - interval '10 minutes'
      `,
      provider,
    );

    const attemptRows = await prisma.$queryRawUnsafe<
      Array<{ avgAttempts: string; maxAttempts: string }>
    >(
      `
      SELECT
        COALESCE(AVG("attemptCount"), 0)::text as "avgAttempts",
        COALESCE(MAX("attemptCount"), 0)::text as "maxAttempts"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND "createdAt" >= NOW() - (($2::text || ' hours')::interval)
      `,
      provider,
      lookbackHours,
    );

    const byStatus: Record<string, number> = {};
    for (const row of rows) {
      byStatus[row.status] = Number(row.count || 0);
    }

    return {
      provider,
      lookbackHours,
      totals: {
        PROCESSING: byStatus.PROCESSING || 0,
        COMPLETE: byStatus.COMPLETE || 0,
        FAILED: byStatus.FAILED || 0,
      },
      staleProcessingCount: Number(staleRows[0]?.count || 0),
      retries: {
        averageAttempts: Number(attemptRows[0]?.avgAttempts || 0),
        maxAttempts: Number(attemptRows[0]?.maxAttempts || 0),
      },
    };
  }

  async getReplayDiagnostics(externalEventId: string, provider = PROVIDER) {
    const normalizedProvider = provider.toLowerCase();
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        provider: string;
        externalEventId: string;
        eventType: string;
        status: string;
        attemptCount: number;
        lastError: string | null;
        processedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `
      SELECT
        "id",
        "provider",
        "externalEventId",
        "eventType",
        "status",
        "attemptCount",
        "lastError",
        "processedAt",
        "createdAt",
        "updatedAt"
      FROM "WebhookEvent"
      WHERE "provider" = $1
        AND "externalEventId" = $2
      LIMIT 1
      `,
      normalizedProvider,
      externalEventId,
    );

    const item = rows[0];
    if (!item) return null;

    return {
      ...item,
      replaySignals: {
        wasRetried: item.attemptCount > 1,
        retryCount: Math.max(0, item.attemptCount - 1),
        isStuckProcessing:
          item.status === 'PROCESSING' &&
          Date.now() - new Date(item.updatedAt).getTime() > 10 * 60 * 1000,
      },
      timing: {
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        processedAt: item.processedAt,
      },
    };
  }
}

export const webhookEventLedgerService = new WebhookEventLedgerService();
