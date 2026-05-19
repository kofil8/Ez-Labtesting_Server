import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { normalizeTurnaround } from '../../utils/turnaroundNormalizer';
import { TestServices } from './tests.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

const parseBooleanField = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
};

const parseIntegerField = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
};

const parseStringArrayField = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall back to comma-separated form below.
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizePayload = (payload: Record<string, unknown>) => {
  const normalized = { ...payload };

  if (normalized.baseTurnaroundDays && typeof normalized.baseTurnaroundDays === 'string') {
    const turnaround = normalizeTurnaround(normalized.baseTurnaroundDays);
    normalized.baseTurnaroundDays = Math.ceil(turnaround.hours / 24);
  }

  for (const key of ['isPanel', 'requiresFasting', 'isActive', 'isPopular', 'removeTestImage']) {
    if (normalized[key] !== undefined) {
      normalized[key] = parseBooleanField(normalized[key]);
    }
  }

  for (const key of ['minAge', 'maxAge']) {
    if (normalized[key] !== undefined) {
      normalized[key] = parseIntegerField(normalized[key]);
    }
  }

  for (const key of ['cptCode', 'searchKeywords', 'componentTestIds']) {
    if (normalized[key] !== undefined) {
      normalized[key] = parseStringArrayField(normalized[key]);
    }
  }

  // backward compatibility for old typo keys
  if (
    normalized.preparationInstructions === undefined &&
    normalized.preperationInstructions !== undefined
  ) {
    normalized.preparationInstructions = normalized.preperationInstructions;
  }

  if (normalized.internalNotes === undefined && normalized.interalNotes !== undefined) {
    normalized.internalNotes = normalized.interalNotes;
  }

  return normalized;
};

const createTest = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const payload = normalizePayload(req.body);
    const file = req.file as Express.Multer.File | undefined;

    const test = await TestServices.createTestInDB(payload, file);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Test created successfully',
      data: test,
    });
  },
);

const getTests = catchAsync(async (req, res) => {
  const tests = await TestServices.getTestsDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tests retrieved successfully',
    meta: tests.meta,
    data: tests.data,
  });
});

const getTestById = catchAsync(async (req, res) => {
  const testId = asParamString(req.params.testId);

  const test = await TestServices.getTestByIdDB(testId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Test retrieved successfully',
    data: test,
  });
});

const getPanelComponents = catchAsync(async (req, res) => {
  const testId = asParamString(req.params.testId);

  const components = await TestServices.getPanelComponentsDB(testId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Panel components retrieved successfully',
    data: components,
  });
});

const updatePanelComponents = catchAsync(async (req, res) => {
  const testId = asParamString(req.params.testId);

  const result = await TestServices.updatePanelComponentsInDB(testId, req.body.componentTestIds);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Panel components updated successfully',
    data: result,
  });
});

const updateTest = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const testId = asParamString(req.params.testId);
    const payload = normalizePayload(req.body);
    const file = req.file as Express.Multer.File | undefined;

    const test = await TestServices.updateTestInDB(testId, payload, file);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Test updated successfully',
      data: test,
    });
  },
);

const deleteTest = catchAsync(async (req, res) => {
  const testId = asParamString(req.params.testId);

  const test = await TestServices.deleteTestFromDB(testId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Test deleted successfully',
    data: test,
  });
});

export const TestController = {
  getTests,
  getTestById,
  getPanelComponents,
  updatePanelComponents,
  createTest,
  updateTest,
  deleteTest,
};
