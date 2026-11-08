import ActivityLog from './activityLog.model.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createActivityLog = (entry) => ActivityLog.create(entry);

export const listActivityLogs = async ({ page, limit, outcome, search }) => {
  const filter = {};
  if (outcome) filter.outcome = outcome;

  if (search) {
    const matcher = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { actorName: matcher },
      { actorEmail: matcher },
      { actorRole: matcher },
      { action: matcher },
      { message: matcher },
      { route: matcher },
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
