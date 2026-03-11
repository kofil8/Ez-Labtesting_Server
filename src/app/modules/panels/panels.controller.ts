import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { PanelServices } from './panels.service';

// ✅ CREATE PANEL
const createPanel = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const payload = req.body;
    const file = req.file as Express.Multer.File | undefined;

    // Log a small summary to help debug premature/automatic requests
    try {
      const name = payload?.name ?? '(no name)';
      const basePrice = payload?.basePrice ?? '(no basePrice)';
      const testIds = Array.isArray(payload?.testIds)
        ? payload.testIds
        : payload?.testIds
          ? [payload.testIds]
          : [];
      console.debug(
        JSON.stringify({
          route: '/panels',
          action: 'create',
          name,
          basePrice,
          tests: testIds.length,
        }),
      );
    } catch (_) {}

    const panel = await PanelServices.createPanelInDB(payload, file);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: 'Test panel created successfully',
      data: panel,
    });
  },
);

// ✅ GET ALL PANELS
const getPanels = catchAsync(async (req: Request, res: Response) => {
  const result = await PanelServices.getPanelsDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Test panels retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

// ✅ GET PANEL BY ID
const getPanelById = catchAsync(async (req: Request, res: Response) => {
  let { panelId } = req.params;
  if (Array.isArray(panelId)) panelId = panelId[0];

  const panel = await PanelServices.getPanelByIdDB(panelId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Test panel retrieved successfully',
    data: panel,
  });
});

// ✅ UPDATE PANEL
const updatePanel = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    let { panelId } = req.params;
    if (Array.isArray(panelId)) panelId = panelId[0];
    const payload = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const panel = await PanelServices.updatePanelInDB(panelId, payload, file);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Test panel updated successfully',
      data: panel,
    });
  },
);

// ✅ DELETE PANEL
const deletePanel = catchAsync(async (req: Request, res: Response) => {
  let { panelId } = req.params;
  if (Array.isArray(panelId)) panelId = panelId[0];

  const panel = await PanelServices.deletePanelFromDB(panelId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Test panel deleted successfully',
    data: panel,
  });
});

export const PanelController = {
  createPanel,
  getPanels,
  getPanelById,
  updatePanel,
  deletePanel,
};
