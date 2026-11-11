import { createActivityLog } from './activityLog.service.js';
import logger from '../../config/logger.js';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const getAction = (req) => {
  const route = req.originalUrl.split('?')[0].replace(/^\/api\/v\d+/, '');
  const lowerRoute = route.toLowerCase();
  const status = req.body?.verificationStatus || req.body?.status;

  // --- Admin verification routes ---
  if (/\/admin\/store-verifications\/[^/]+\/approve$/.test(lowerRoute))
    return 'Store verification approved';
  if (/\/admin\/store-verifications\/[^/]+\/reject$/.test(lowerRoute))
    return 'Store verification rejected';
  if (/\/admin\/manager-verifications\/[^/]+\/approve$/.test(lowerRoute))
    return 'Manager account approved';
  if (/\/admin\/manager-verifications\/[^/]+\/reject$/.test(lowerRoute))
    return 'Manager account rejected';
  if (/\/admin\/users\/[^/]+\/verify$/.test(lowerRoute)) return 'User account verified';
  if (/\/admin\/users\/[^/]+\/reject$/.test(lowerRoute)) return 'User account rejected';
  if (/\/admin\/users\/[^/]+\/status$/.test(lowerRoute)) return `User status updated`;

  // --- Store admin invite/approve/reject ---
  if (/\/auth\/store-admin\/invitations$/.test(lowerRoute))
    return 'Store administrator invitation sent';
  if (/\/auth\/store-admin\/[^/]+\/approve$/.test(lowerRoute))
    return 'Store administrator account approved';
  if (/\/auth\/store-admin\/[^/]+\/reject$/.test(lowerRoute))
    return 'Store administrator account rejected';

  // --- Organization ---
  if (/\/organizations\/[^/]+\/approval$/.test(lowerRoute)) {
    return `Organization ${status === 'rejected' ? 'rejected' : 'approved'}`;
  }

  // --- Payroll ---
  if (/\/payroll\/payrun$/.test(lowerRoute)) return 'Payroll run executed';
  if (/\/payroll\/[^/]+\/status$/.test(lowerRoute)) return 'Payroll status updated';
  if (/\/payroll/.test(lowerRoute)) return 'Payroll record updated';

  // --- Notifications ---
  if (/\/notifications\/broadcast$/.test(lowerRoute)) return 'Broadcast notification sent';
  if (/\/notifications/.test(lowerRoute)) return 'Notification updated';

  // --- Departments / Designations ---
  if (/\/departments\/[^/]+\/designations/.test(lowerRoute))
    return `Designation ${req.method === 'DELETE' ? 'deleted' : req.method === 'POST' ? 'created' : 'updated'}`;
  if (/\/departments/.test(lowerRoute))
    return `Department ${req.method === 'DELETE' ? 'deleted' : req.method === 'POST' ? 'created' : 'updated'}`;

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

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'cookie']);

/**
 * Sanitize an object so we never log credentials or tokens.
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !SENSITIVE_KEYS.has(k.toLowerCase())),
  );
};

/**
 * Extract a human-readable message from the response body.
 * Appends validation error messages when body.errors is present.
 */
const getMessage = (body, outcome) => {
  const parts = [];

  const base = typeof body?.message === 'string' ? body.message.trim() : '';
  if (base) parts.push(base);

  // express-validator / ApiError errors array: [{ msg, path } | string]
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    const errMsgs = body.errors
      .map((e) => (typeof e === 'string' ? e : e?.msg || e?.message || JSON.stringify(e)))
      .filter(Boolean)
      .join('; ');
    if (errMsgs) parts.push(`Errors: ${errMsgs}`);
  } else if (body?.errors && typeof body.errors === 'object') {
    const errMsgs = Object.values(body.errors)
      .map((e) => (typeof e === 'string' ? e : e?.msg || e?.message || JSON.stringify(e)))
      .filter(Boolean)
      .join('; ');
    if (errMsgs) parts.push(`Errors: ${errMsgs}`);
  }

  // Plain body.error string (some libs use this)
  if (typeof body?.error === 'string' && body.error.trim()) {
    parts.push(body.error.trim());
  }

  const combined = parts
    .join(' | ')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 1000);
  return combined || (outcome === 'success' ? 'Action completed successfully' : 'Action failed');
};

/**
 * Extract structured details to store alongside the message.
 * Never includes sensitive fields.
 */
const getDetails = (body) => {
  if (!body || typeof body !== 'object') return null;

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return sanitize({ errors: body.errors });
  }
  if (body.errors && typeof body.errors === 'object') {
    return sanitize({ errors: body.errors });
  }
  return null;
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
      details: outcome === 'failure' ? getDetails(body) : null,
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
