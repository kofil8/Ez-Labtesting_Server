import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { LabCenterServices } from './lab-centers.service';

const asParamString = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const getLabCenters = catchAsync(async (req: Request, res: Response) => {
  const labCenters = await LabCenterServices.getLabCenters(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab centers retrieved successfully',
    data: labCenters,
  });
});

const getNationwideLabCenters = catchAsync(async (req: Request, res: Response) => {
  const result = await LabCenterServices.getNationwideLabCenters(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Nationwide lab availability retrieved successfully',
    data: result,
  });
});

const getLabCenterById = catchAsync(async (req: Request, res: Response) => {
  const labCenterId = asParamString(req.params.labCenterId);
  const labCenter = await LabCenterServices.getLabCenterById(labCenterId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Lab center retrieved successfully',
    data: labCenter,
  });
});

const geocode = catchAsync(async (req: Request, res: Response) => {
  const result = await LabCenterServices.geocodeAddress(req.body.address);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Address geocoded successfully',
    data: result,
  });
});

const autocomplete = catchAsync(async (req: Request, res: Response) => {
  const input = asParamString(req.query.input);
  const suggestions = await LabCenterServices.autocompleteLocations(input as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Autocomplete suggestions retrieved successfully',
    data: suggestions,
  });
});

const getPlaceDetails = catchAsync(async (req: Request, res: Response) => {
  const placeId = asParamString(req.params.placeId);
  const details = await LabCenterServices.getPlaceDetails(placeId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Place details retrieved successfully',
    data: details,
  });
});

export const LabCenterController = {
  autocomplete,
  geocode,
  getLabCenterById,
  getLabCenters,
  getNationwideLabCenters,
  getPlaceDetails,
};
