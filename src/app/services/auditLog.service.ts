import prisma from '../../shared/prisma';
import { redactSensitive } from '../utils/redactSensitive';

type AuditInput = {
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  status?: 'success' | 'failure';
  errorMessage?: string;
  actorId?: string;
  actorName?: string;
};

class AuditLogService {
  async record(input: AuditInput) {
    const {
      action,
      resource,
      resourceId,
      details,
      status = 'success',
      errorMessage,
      actorId = 'SYSTEM',
      actorName = 'SYSTEM',
    } = input;

    try {
      await prisma.auditLog.create({
        data: {
          adminId: actorId,
          adminName: actorName,
          action,
          resource,
          resourceId,
          details: JSON.stringify(redactSensitive(details)),
          status,
          errorMessage,
        },
      });
    } catch {
      // Audit must never break business flows.
    }
  }
}

export const auditLogService = new AuditLogService();
