export const ROLES = Object.freeze({
    ADMIN: 'admin',
    STORE_ADMIN: 'storeadmin',
    MANAGER: 'manager',
    EMPLOYEE: 'employ',
});

export const ROLE_LABELS = Object.freeze({
    [ROLES.ADMIN]: 'System Administrator',
    [ROLES.STORE_ADMIN]: 'Store Administrator',
    [ROLES.MANAGER]: 'Store Manager',
    [ROLES.EMPLOYEE]: 'Employee',
});

export const ACCOUNT_STATUS = Object.freeze({
    PENDING: 'pending',
    VERIFIED: 'verified',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
});

/**
 * Normalizes backend or legacy role strings to standardized role constant.
 */
export function normalizeRole(role) {
    if (!role) return ROLES.EMPLOYEE;
    const r = String(role).toLowerCase().trim().replace(/[-_]/g, '');
    if (r === 'admin') return ROLES.ADMIN;
    if (r === 'storeadmin') return ROLES.STORE_ADMIN;
    if (r === 'manager' || r === 'storemanager') return ROLES.MANAGER;
    if (r === 'employ' || r === 'employee') return ROLES.EMPLOYEE;
    return ROLES.EMPLOYEE;
}

/**
 * Returns role-based default dashboard path
 */
export function getRoleDashboardPath(role) {
    const normalized = normalizeRole(role);
    switch (normalized) {
        case ROLES.ADMIN:
            return '/admin/dashboard';
        case ROLES.STORE_ADMIN:
            return '/store-admin/dashboard';
        case ROLES.MANAGER:
            return '/store-manager/dashboard';
        case ROLES.EMPLOYEE:
            return '/employee/dashboard';
        default:
            return '/login';
    }
}

