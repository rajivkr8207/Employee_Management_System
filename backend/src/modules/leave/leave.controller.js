import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  applyForLeave,
  cancelLeave,
  getLeave,
  getMyLeaves,
  listLeaves,
  reviewLeave,
} from './leave.service.js';

export const submitLeaveApplication = asyncHandler(async (req, res) => {
  const leave = await applyForLeave({
    userId: req.user.id,
    leaveData: req.body,
  });
  return res.status(201).json(new ApiResponse(201, { leave }, 'Leave application submitted'));
});

export const getMyLeaveApplications = asyncHandler(async (req, res) => {
  const leaves = await getMyLeaves({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
  });
  return res.status(200).json(new ApiResponse(200, { leaves }, 'Your leave applications fetched'));
});

export const getLeaveApplications = asyncHandler(async (req, res) => {
  const leaves = await listLeaves({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
    employeeId: req.query.employeeId,
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
  });
  return res.status(200).json(new ApiResponse(200, { leaves }, 'Leave applications fetched'));
});

export const getLeaveApplication = asyncHandler(async (req, res) => {
  const leave = await getLeave({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    leaveId: req.params.leaveId,
  });
  return res.status(200).json(new ApiResponse(200, { leave }, 'Leave application fetched'));
});

export const reviewLeaveApplication = asyncHandler(async (req, res) => {
  const leave = await reviewLeave({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    leaveId: req.params.leaveId,
    status: req.body.status,
  });
  return res.status(200).json(new ApiResponse(200, { leave }, 'Leave application reviewed'));
});

export const cancelLeaveApplication = asyncHandler(async (req, res) => {
  await cancelLeave({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    leaveId: req.params.leaveId,
  });
  return res.status(200).json(new ApiResponse(200, {}, 'Leave application cancelled'));
});
