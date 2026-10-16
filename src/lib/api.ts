import { SITE } from './config';

export type AnnouncementKind = 'advisory' | 'news' | 'event';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  kind: AnnouncementKind;
  link: string | null;
  published: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export type ReportStatus = 'new' | 'triaged' | 'resolved' | 'spam';

export interface Report {
  id: number;
  category: string;
  barangay: string;
  message: string;
  name: string | null;
  contact: string | null;
  page: string | null;
  status: ReportStatus;
  createdAt: string;
}

export const REPORT_CATEGORIES = [
  { value: 'correction', label: 'Wrong or outdated info on BetterNaic' },
  { value: 'road', label: 'Roads, drainage or streetlights' },
  { value: 'garbage', label: 'Garbage or illegal dumping' },
  { value: 'flood', label: 'Flooding' },
  { value: 'service', label: 'Problem with a municipal service' },
  { value: 'suggestion', label: 'Suggestion for BetterNaic' },
  { value: 'other', label: 'Something else' },
] as const;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  let res: Response;
  try {
    res = await fetch(`${SITE.apiUrl}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  announcements: () =>
    request<{ items: Announcement[] }>('/api/announcements'),

  submitReport: (body: {
    category: string;
    barangay: string;
    message: string;
    name?: string;
    contact?: string;
    page?: string;
    website?: string;
    turnstileToken: string;
  }) =>
    request<{ ok: true; id: number }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (key: string, turnstileToken: string) =>
    request<{ token: string; name: string; expiresAt: number }>(
      '/api/admin/login',
      { method: 'POST', body: JSON.stringify({ key, turnstileToken }) }
    ),

  reports: (token: string, status: string) =>
    request<{ items: Report[] }>(
      `/api/admin/reports?status=${encodeURIComponent(status)}`,
      { token }
    ),

  setReportStatus: (token: string, id: number, status: ReportStatus) =>
    request<{ ok: true }>(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),

  adminAnnouncements: (token: string) =>
    request<{ items: Announcement[] }>('/api/admin/announcements', { token }),

  saveAnnouncement: (
    token: string,
    a: Omit<Announcement, 'id' | 'createdAt'> & { id?: number }
  ) =>
    request<{ ok: true; id: number }>(
      a.id ? `/api/admin/announcements/${a.id}` : '/api/admin/announcements',
      { method: a.id ? 'PATCH' : 'POST', token, body: JSON.stringify(a) }
    ),

  deleteAnnouncement: (token: string, id: number) =>
    request<{ ok: true }>(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      token,
    }),
};
