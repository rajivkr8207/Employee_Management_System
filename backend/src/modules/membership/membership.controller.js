import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listMemberships } from './membership.service.js';

export const getMemberships = asyncHandler(async (req, res) => {
  const memberships = await listMemberships({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { memberships }, 'Memberships fetched successfully'));
});
