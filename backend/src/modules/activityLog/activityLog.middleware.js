import { createActivityLog } from './activityLog.service.js';
import logger from '../../config/logger.js';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const getAction = (req) => {
  const route = req.originalUrl.split('?')[0].replace(/^\/api\/v\d+/, '');
  const lowerRoute = route.toLowerCase();
  const status = req.body?.verificationStatus || req.body?.status;

  if (/\/admin\/store-verifications\/[^/]+\/approve$/.test(lowerRoute)) {
    return 'Store verification approved';
  }
  if (/\/admin\/store-verifications\/[^/]+\/reject$/.test(lowerRoute)) {
    return 'Store verification rejected';
  }
  if (/\/admin\/manager-verifications\/[^/]+\/approve$/.test(lowerRoute)) {
    return 'Manager account approved';
  }
  if (/\/admin\/manager-verifications\/[^/]+\/reject$/.test(lowerRoute)) {
    return 'Manager account rejected';
  }
  if (/\/auth\/store-admin\/invitations$/.test(lowerRoute)) {
    return 'Store administrator invitation sent';
  }
  if (/\/auth\/store-admin\/[^/]+\/approve$/.test(lowerRoute)) {
    return 'Store administrator account approved';
  }
  if (/\/auth\/store-admin\/[^/]+\/reject$/.test(lowerRoute)) {
    return 'Store administrator account rejected';
  }
  if (/\/organizations\/[^/]+\/approval$/.test(lowerRoute)) {
    return `Organization ${status === 'rejected' ? 'rejected' : 'approved'}`;
  }

  const actionByMethod = {
    POST: 'created',
    PUT: 'updated',
    PATCH: 'updated',
    DELETE: 'deleted',
  };
  const resource = lowerRoute.startsWith('/auth/profile')
    ? 'profile'
    : lowerRoute.startsWith('/auth/change-password')
      ? 'password'
      : lowerRoute.startsWith('/auth/face')
        ? 'face attendance profile'
        : lowerRoute.startsWith('/organizations')
          ? 'organization'
          : lowerRoute.startsWith('/stores')
            ? 'store'
            : lowerRoute.startsWith('/employees')
              ? 'employee'
              : lowerRoute.startsWith('/attendance')
                ? 'attendance record'
                : lowerRoute.startsWith('/leaves')
                  ? 'leave request'
                  : lowerRoute.startsWith('/shifts')
                    ? 'shift'
                    : lowerRoute.startsWith('/memberships')
                      ? 'membership'
                      : 'account';

  return `${resource[0].toUpperCase()}${resource.slice(1)} ${actionByMethod[req.method]}`;
};

const getMessage = (body, outcome) => {
  const message = typeof body?.message === 'string' ? body.message : '';
  const normalized = message
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 300);
  return normalized || (outcome === 'success' ? 'Action completed successfully' : 'Action failed');
};

export const auditActivity = (req, res, next) => {
  if (!writeMethods.has(req.method)) return next();

  const sendJson = res.json.bind(res);
  let responseHandled = false;

  res.json = (body) => {
    if (responseHandled) return sendJson(body);
    responseHandled = true;

    if (!req.user?.id) return sendJson(body);

    const outcome = res.statusCode >= 400 ? 'failure' : 'success';
    const entry = {
      actorId: req.user.id,
      actorName: req.user.fullName || req.user.email,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: getAction(req),
      method: req.method,
      route: req.originalUrl
        .split('?')[0]
        .replace(/^\/api\/v\d+/, '')
        .slice(0, 240),
      outcome,
      statusCode: res.statusCode,
      message: getMessage(body, outcome),
    };

    createActivityLog(entry)
      .catch((error) => {
        logger.error('Failed to persist activity log', {
          error: error.message,
          actorId: entry.actorId,
          action: entry.action,
        });
      })
      .finally(() => sendJson(body));

    return res;
  };

  return next();
};
