import { PromoCodeStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data?: any;
}

import prisma from '../../../shared/prisma';
import { webhookEventLedgerService } from '../../services/webhookEventLedger.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);
const managedAdminRoles: Role[] = [Role.ADMIN, Role.LAB_PARTNER];

const isManagedAdminRole = (role: Role) => managedAdminRoles.includes(role);

const formatMonthLabel = (date: Date) =>
  date.toLocaleString('en-US', { month: 'short', year: '2-digit' });

/* ==========================================
   ADMIN MANAGEMENT CONTROLLERS
========================================== */

// Get all admins with pagination
export const getAdmins = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: managedAdminRoles,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        lastLogin: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: {
        role: {
          in: managedAdminRoles,
        },
      },
    }),
  ]);

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Admins and Lab_partners retrieved successfully',
    data: {
      admins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  };

  res.json(response);
});

// Get admin by ID
export const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const id = asParamString(req.params.id);

  const admin = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      isVerified: true,
      status: true,
    },
  });

  if (!admin) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Admin not found',
    });
  }

  if (!isManagedAdminRole(admin.role)) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Admin not found',
    });
  }

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Admin retrieved successfully',
    data: admin,
  };

  res.json(response);
});

// Create new admin
export const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const { email, firstName, lastName, phoneNumber, password, role } = req.body;

  // Validate role
  if (role !== Role.ADMIN && role !== Role.LAB_PARTNER) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Invalid role. Must be ADMIN or LAB_PARTNER',
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user
  const newAdmin = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword,
      role,
      isVerified: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  const response: ApiResponse = {
    statusCode: 201,
    success: true,
    message: 'Admin created successfully',
    data: newAdmin,
  };

  res.status(201).json(response);
});

// Update admin
export const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = asParamString(req.params.id);
  const { email, firstName, lastName, phoneNumber, role, status } = req.body;

  // Validate role if provided
  if (role && role !== Role.ADMIN && role !== Role.LAB_PARTNER) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Invalid role. Must be ADMIN or LAB_PARTNER',
    });
  }

  // Check if user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingAdmin) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Admin not found',
    });
  }

  if (!isManagedAdminRole(existingAdmin.role)) {
    return res.status(403).json({
      statusCode: 403,
      success: false,
      message: 'Super admin account cannot be modified',
    });
  }

  // Check if new email is already in use
  if (email && email !== existingAdmin.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: 'Email already in use',
      });
    }
  }

  // Update admin
  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: {
      ...(email && { email }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phoneNumber && { phoneNumber }),
      ...(role && { role }),
      ...(status && { status }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      role: true,
      status: true,
      lastLogin: true,
      updatedAt: true,
    },
  });

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Admin updated successfully',
    data: updatedAdmin,
  };

  res.json(response);
});

// Set temporary password for an admin
export const setTemporaryPassword = catchAsync(async (req: Request, res: Response) => {
  const adminId = asParamString(req.params.adminId);

  // Check if admin exists
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Admin not found',
    });
  }

  // Verify the target is an admin
  if (!isManagedAdminRole(admin.role)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'User is not an admin',
    });
  }

  // Generate temporary password (12 chars: alphanumeric + special chars)
  const tempPassword = generateTemporaryPassword();

  // Hash password
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Update admin password
  await prisma.user.update({
    where: { id: adminId },
    data: {
      password: hashedPassword,
      lastPasswordChangedAt: new Date(),
    },
  });

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Temporary password generated successfully',
    data: {
      adminId,
      temporaryPassword: tempPassword,
      note: 'Share this password securely with the admin. They should change it on first login.',
    },
  };

  res.json(response);
});

// Helper function to generate secure temporary password
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random chars
  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// Delete admin
export const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = asParamString(req.params.id);
  const requestingUserId = (req as any).user?.id;

  // Prevent deleting self
  if (id === requestingUserId) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Cannot delete your own admin account',
    });
  }

  // Check if admin exists
  const admin = await prisma.user.findUnique({
    where: { id },
  });

  if (!admin) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Admin not found',
    });
  }

  if (!isManagedAdminRole(admin.role)) {
    return res.status(403).json({
      statusCode: 403,
      success: false,
      message: 'Super admin account cannot be deleted',
    });
  }

  // Delete admin
  await prisma.user.delete({
    where: { id },
  });

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Admin deleted successfully',
  };

  res.json(response);
});

// Dashboard summary (real analytics)
export const getDashboardSummary = catchAsync(async (_req: Request, res: Response) => {
  const now = new Date();
  const currentWindowStart = new Date(now);
  currentWindowStart.setDate(now.getDate() - 30);

  const previousWindowStart = new Date(currentWindowStart);
  previousWindowStart.setDate(previousWindowStart.getDate() - 30);

  const [orders, activeTests, totalUsers, activeAdmins, activePromoCodes] = await Promise.all([
    prisma.order.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        orderItems: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            testName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.test.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: { in: managedAdminRoles } } }),
    prisma.promoCode.count({ where: { status: PromoCodeStatus.ACTIVE } }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED').length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingResults = orders.filter((o) =>
    ['LAB_SUBMISSION_PENDING', 'MANUAL_REVIEW', 'IN_PROCESSING'].includes(o.orderStatus),
  ).length;

  const currentOrders = orders.filter((o) => o.createdAt >= currentWindowStart);
  const previousOrders = orders.filter(
    (o) => o.createdAt >= previousWindowStart && o.createdAt < currentWindowStart,
  );

  const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const revenueGrowth =
    previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const orderGrowth =
    previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.set(formatMonthLabel(d), 0);
  }

  orders.forEach((order) => {
    const key = formatMonthLabel(order.createdAt);
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) || 0) + Number(order.total || 0));
    }
  });

  const revenueByMonth = Array.from(monthBuckets.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  const statusBuckets = new Map<string, number>();
  orders.forEach((order) => {
    const name = order.orderStatus;
    statusBuckets.set(name, (statusBuckets.get(name) || 0) + 1);
  });

  const ordersByStatus = Array.from(statusBuckets.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const testRevenue = new Map<string, number>();
  orders.forEach((order) => {
    const testName = order.orderItems[0]?.testName || 'Unknown Test';
    testRevenue.set(testName, (testRevenue.get(testName) || 0) + Number(order.total || 0));
  });

  const topSellingTests = Array.from(testRevenue.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const revenueByPaymentMethodMap = new Map<string, number>();
  orders.forEach((order) => {
    const method =
      order.paymentMethodType?.toLowerCase() === 'card'
        ? 'Card'
        : order.paymentMethodType?.toLowerCase() === 'cash'
          ? 'Cash'
          : 'Other';
    revenueByPaymentMethodMap.set(
      method,
      (revenueByPaymentMethodMap.get(method) || 0) + Number(order.total || 0),
    );
  });
  const revenueByPaymentMethod = Array.from(revenueByPaymentMethodMap.entries()).map(
    ([name, revenue]) => ({ name, revenue }),
  );

  const recentOrders = orders.slice(0, 10).map((order) => ({
    id: order.id,
    customerName:
      [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') ||
      order.user?.email ||
      'N/A',
    totalAmount: Number(order.total || 0),
    status: String(order.orderStatus || 'PENDING').toLowerCase(),
    orderDate: order.createdAt,
  }));

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: {
      stats: {
        totalRevenue,
        totalOrders,
        pendingResults,
        activeTests,
        averageOrderValue,
        completedOrders,
        revenueGrowth,
        orderGrowth,
        activePromoCodes,
        totalUsers,
        activeAdmins,
      },
      revenueByMonth,
      ordersByStatus,
      topSellingTests,
      revenueByPaymentMethod,
      recentOrders,
    },
  };

  res.json(response);
});

/* ==========================================
   SYSTEM SETTINGS CONTROLLERS
========================================== */

// Get system settings (mock - would need SystemSetting model)
export const getSystemSettings = catchAsync(async (req: Request, res: Response) => {
  // Mock settings response
  const settings = [
    {
      id: '1',
      name: 'Platform Name',
      value: 'Ez LabTesting',
      type: 'text',
    },
    {
      id: '2',
      name: 'Support Email',
      value: 'support@ezlabtesting.com',
      type: 'text',
    },
    {
      id: '3',
      name: 'Max Upload Size (MB)',
      value: 50,
      type: 'number',
    },
    {
      id: '4',
      name: 'Enable Email Notifications',
      value: true,
      type: 'boolean',
    },
  ];

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'System settings retrieved successfully',
    data: settings,
  };

  res.json(response);
});

// Update system setting
export const updateSystemSetting = catchAsync(async (req: Request, res: Response) => {
  const { key, value } = req.body;

  // Mock update - would need proper database integration
  if (!key || value === undefined) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Key and value are required',
    });
  }

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'System setting updated successfully',
    data: { key, value },
  };

  res.json(response);
});

/* ==========================================
   AUDIT LOG CONTROLLERS
========================================== */

// Get audit logs (mock - would need AuditLog model)
export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;
  const offset = typeof req.query.offset === 'string' ? Number(req.query.offset) : 0;
  const adminIdOrName = typeof req.query.adminId === 'string' ? req.query.adminId : undefined;
  const action = typeof req.query.action === 'string' ? req.query.action : undefined;
  const resource = typeof req.query.resource === 'string' ? req.query.resource : undefined;

  const where: any = {};
  if (adminIdOrName) {
    // support searching by adminId or adminName
    where.OR = [
      { adminId: adminIdOrName },
      { adminName: { contains: adminIdOrName, mode: 'insensitive' } },
    ];
  }
  if (action) where.action = action;
  if (resource) where.resource = resource;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const mapped = logs.map((l) => ({
    id: l.id,
    adminId: l.adminId,
    adminName: l.adminName,
    action: l.action,
    resource: l.resource,
    resourceId: l.resourceId,
    details: (() => {
      try {
        // details may be stored JSON string
        const parsed = JSON.parse(l.details);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch {
        return l.details;
      }
    })(),
    timestamp: l.createdAt.toISOString(),
    ipAddress: l.ipAddress || '',
    status: (l.status || 'SUCCESS').toLowerCase() === 'success' ? 'success' : 'failed',
    changesBefore: l.changesBefore,
    changesAfter: l.changesAfter,
  }));

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Audit logs retrieved successfully',
    data: { logs: mapped, total },
  };

  res.json(response);
});

// Get audit log by ID
export const getAuditLogById = catchAsync(async (req: Request, res: Response) => {
  const id = asParamString(req.params.id);

  const record = await prisma.auditLog.findUnique({ where: { id } });
  if (!record) {
    return res
      .status(404)
      .json({ statusCode: 404, success: false, message: 'Audit log not found' });
  }

  const data = {
    id: record.id,
    adminId: record.adminId,
    adminName: record.adminName,
    action: record.action,
    resource: record.resource,
    resourceId: record.resourceId,
    details: (() => {
      try {
        const parsed = JSON.parse(record.details);
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch {
        return record.details;
      }
    })(),
    timestamp: record.createdAt.toISOString(),
    ipAddress: record.ipAddress,
    status: (record.status || 'SUCCESS').toLowerCase() === 'success' ? 'success' : 'failed',
    changesBefore: record.changesBefore,
    changesAfter: record.changesAfter,
  };

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Audit log retrieved successfully',
    data,
  };

  res.json(response);
});

/* ==========================================
   WEBHOOK LEDGER CONTROLLERS
========================================== */

export const getWebhookLedgerSummary = catchAsync(async (req: Request, res: Response) => {
  const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;
  const lookbackHours =
    typeof req.query.lookbackHours === 'string' ? Number(req.query.lookbackHours) : undefined;

  const summary = await webhookEventLedgerService.getStatusSummary({
    provider,
    lookbackHours,
  });

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Webhook ledger summary retrieved successfully',
    data: summary,
  };

  res.json(response);
});

export const getWebhookLedgerEvents = catchAsync(async (req: Request, res: Response) => {
  const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const eventType = typeof req.query.eventType === 'string' ? req.query.eventType : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const offset = typeof req.query.offset === 'string' ? Number(req.query.offset) : undefined;

  const result = await webhookEventLedgerService.listEvents({
    provider,
    status,
    eventType,
    limit,
    offset,
  });

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Webhook ledger events retrieved successfully',
    data: result,
  };

  res.json(response);
});

export const getWebhookReplayDiagnostics = catchAsync(async (req: Request, res: Response) => {
  const externalEventId = asParamString(req.params.externalEventId);
  const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined;

  const diagnostics = await webhookEventLedgerService.getReplayDiagnostics(
    externalEventId,
    provider,
  );

  if (!diagnostics) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: 'Webhook event not found',
    });
  }

  const response: ApiResponse = {
    statusCode: 200,
    success: true,
    message: 'Webhook replay diagnostics retrieved successfully',
    data: diagnostics,
  };

  res.json(response);
});

export const SuperAdminController = {
  getDashboardSummary,
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  setTemporaryPassword,
  deleteAdmin,
  getSystemSettings,
  updateSystemSetting,
  getAuditLogs,
  getAuditLogById,
  getWebhookLedgerSummary,
  getWebhookLedgerEvents,
  getWebhookReplayDiagnostics,
};
