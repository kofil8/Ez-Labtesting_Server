import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { LabCenterServices } from './lab-centers.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

const getLabCenters = catchAsync(async (req, res) => {
  const labCenters = await LabCenterServices.getLabCentersDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab centers retrieved successfully',
    data: labCenters,
  });
});

const getLabCenterById = catchAsync(async (req, res) => {
  const id = asParamString(req.params.id);

  const labCenter = await LabCenterServices.getLabCenterByIdDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab center retrieved successfully',
    data: labCenter,
  });
});

const createLabCenter = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const labCenter = await LabCenterServices.createLabCenterInDB(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Lab center created successfully',
    data: labCenter,
  });
});

const updateLabCenter = catchAsync(async (req: Request, res: Response) => {
  const id = asParamString(req.params.id);
  const payload = req.body;

  const labCenter = await LabCenterServices.updateLabCenterInDB(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab center updated successfully',
    data: labCenter,
  });
});

const deleteLabCenter = catchAsync(async (req, res) => {
  const id = asParamString(req.params.id);

  await LabCenterServices.deleteLabCenterFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab center deleted successfully',
    data: null,
  });
});

const geocode = catchAsync(async (req: Request, res: Response) => {
  const { address } = req.body;

  const result = await LabCenterServices.geocodeAddress(address);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Address geocoded successfully',
    data: result,
  });
});

const autocomplete = catchAsync(async (req: Request, res: Response) => {
  const input = asParamString(req.query.input || '');
  const suggestions = await LabCenterServices.autocompleteLocations(input);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Autocomplete suggestions retrieved successfully',
    data: suggestions,
  });
});

const getPlaceDetails = catchAsync(async (req: Request, res: Response) => {
  const placeId = asParamString(req.params.placeId);
  const details = await LabCenterServices.getGooglePlaceDetails(placeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Place details retrieved successfully',
    data: details,
  });
});

export const LabCenterController = {
  getLabCenters,
  getLabCenterById,
  createLabCenter,
  updateLabCenter,
  deleteLabCenter,
  geocode,
  autocomplete,
  getPlaceDetails,
};
