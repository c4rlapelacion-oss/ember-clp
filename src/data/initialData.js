import { talks } from './talks';

export const DB_KEY = 'ember-clp-database-v3';
export const SESSION_KEY = 'ember-clp-session-v3';
export const ADMIN_EMAIL = 'teamleader@ember.com';
// SHA-256 of ember123
export const ADMIN_PASSWORD_HASH = 'bae292b4552e5128341a1942e01e6ef5e687722181142424b80f87cea93bf113';

export function createInitialData() {
  const now = new Date().toISOString();
  return {
    version: 3,
    settings: {
      appName: 'EMBER',
      organization: 'Singles for Christ · Tayabas City',
      batchName: 'Tayabas CLP',
      registrationOpen: true,
      createdAt: now
    },
    users: [{
      uid: 'admin-teamleader',
      fullName: 'EMBER Team Leader',
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'admin',
      requestedRole: 'admin',
      accountStatus: 'approved',
      groupId: null,
      batchId: 'tayabas-clp',
      mobileNumber: '',
      mobileNumberVisible: false,
      location: 'Tayabas City',
      parish: '',
      bio: 'Team Leader and EMBER administrator.',
      avatar: 'ET',
      photoURL: '',
      createdAt: now,
      approvedAt: now
    }],
    groups: [],
    joinRequests: [],
    posts: [],
    comments: [],
    reactions: [],
    savedPosts: [],
    polls: [],
    pollResponses: [],
    attendance: [],
    progress: [],
    materials: [],
    events: [],
    eventResponses: [],
    notifications: [],
    contentReports: [],
    auditLogs: [],
    talks: talks.map((talk) => ({
      ...talk,
      status: 'published',
      speaker: '',
      venue: '',
      schedule: '',
      updatedAt: now
    }))
  };
}
