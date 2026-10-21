import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createOrganization,
  getOwnerOrganization,
  listPendingOrganizations,
  updateOrganizationApproval,
} from './organization.service.js';

export const createOrganizationForOwner = asyncHandler(async (req, res) => {
  const organization = await createOrganization(req.body, req.user.id);
  return res
    .status(201)
    .json(new ApiResponse(201, { organization }, 'Organization submitted for approval'));
});

export const getMyOrganization = asyncHandler(async (req, res) => {
  const organization = await getOwnerOrganization(req.user.id);
  return res.status(200).json(new ApiResponse(200, { organization }, 'Organization fetched'));
});

export const getPendingOrganizations = asyncHandler(async (req, res) => {
  const organizations = await listPendingOrganizations();
  return res
    .status(200)
    .json(new ApiResponse(200, { organizations }, 'Pending organizations fetched'));
});

export const reviewOrganization = asyncHandler(async (req, res) => {
  const organization = await updateOrganizationApproval(
    req.params.organizationId,
    req.body.verificationStatus,
    req.user.id,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { organization }, 'Organization review completed'));
});
