import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';
import Turnstile from '../components/Turnstile';
import {
  api,
  ApiError,
  REPORT_CATEGORIES,
  type Announcement,
  type AnnouncementKind,
  type Report,
  type ReportStatus,
} from '../lib/api';
import { cn } from '../lib/utils';

// Moderator console. The session token lives in sessionStorage, so it is gone
// when the tab closes; the Worker also expires it after a few hours.
const KEY = 'betternaic.session';
type Session = { token: string; name: string; expiresAt: number };

function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null') as Session | null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

const input =
  'mt-1 block min-h-11 w-full rounded-md border-2 border-gray-500 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
const STATUSES: ReportStatus[] = ['new', 'triaged', 'resolved', 'spam'];
const catLabel = (v: string) => REPORT_CATEGORIES.find(c => c.value === v)?.label ?? v;

function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [key, setKey] = useState('');
  const [token, setToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) return setError('Complete the verification check first.');
    setBusy(true);
    try {
      const s = await api.login(key.trim(), token);
      sessionStorage.setItem(KEY, JSON.stringify(s));
      onLogin(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed.');
      setToken('');
      setResetKey(k => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
        <KeyRound className="h-6 w-6 text-primary-500" aria-hidden /> Moderator sign-in
      </h1>
      <p className="mt-2 text-sm text-gray-600">For BetterNaic volunteers. Use the personal access key you were given.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="key" className="font-medium text-gray-900">Access key</label>
          <input id="key" type="password" autoComplete="current-password" required value={key} onChange={e => setKey(e.target.value)} className={input} />
        </div>
        <Turnstile action="login" onToken={setToken} resetKey={resetKey} />
        {error && <p role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-primary-500 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function Reports({ token, onAuthError }: { token: string; onAuthError: (e: unknown) => void }) {
  const [status, setStatus] = useState<ReportStatus | 'all'>('new');
  const [items, setItems] = useState<Report[] | null>(null);

  const load = useCallback(() => {
    setItems(null);
    api.reports(token, status).then(r => setItems(r.items)).catch(onAuthError);
  }, [token, status, onAuthError]);
  useEffect(load, [load]);

  async function move(id: number, next: ReportStatus) {
    try {
      await api.setReportStatus(token, id, next);
      setItems(list => (list ?? []).filter(r => status === 'all' || r.id !== id).map(r => (r.id === id ? { ...r, status: next } : r)));
    } catch (e) {
      onAuthError(e);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['new', 'triaged', 'resolved', 'spam', 'all'] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} className={cn('rounded-full px-3 py-1 text-sm font-medium capitalize', status === s ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
            {s}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1 text-sm text-primary-600" aria-label="Reload reports">
          <RefreshCw className="h-4 w-4" aria-hidden /> Reload
        </button>
      </div>
      {items === null ? (
        <p className="text-gray-600">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No reports here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(r => (
            <li key={r.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="rounded bg-primary-50 px-2 py-0.5 font-semibold text-primary-700">{catLabel(r.category)}</span>
                <span>{r.barangay}</span>
                <span>· #{r.id}</span>
                <span>· {new Date(r.createdAt).toLocaleString('en-PH')}</span>
                <span className="ml-auto capitalize">{r.status}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-gray-900">{r.message}</p>
              {(r.name || r.contact || r.page) && (
                <p className="mt-2 text-sm text-gray-600">
                  {[r.name, r.contact, r.page && `page: ${r.page}`].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.filter(s => s !== r.status).map(s => (
                  <button key={s} onClick={() => move(r.id, s)} className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium capitalize hover:bg-gray-50">
                    Mark {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY = { title: '', body: '', kind: 'advisory' as AnnouncementKind, link: '', published: true, expiresAt: '' };

function Announcements({ token, onAuthError }: { token: string; onAuthError: (e: unknown) => void }) {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: number }>(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.adminAnnouncements(token).then(r => setItems(r.items)).catch(onAuthError);
  }, [token, onAuthError]);
  useEffect(load, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.saveAnnouncement(token, {
        ...form,
        link: form.link.trim() || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onAuthError(err);
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(token, id);
      load();
    } catch (e) {
      onAuthError(e);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-3 rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900">{form.id ? `Edit announcement #${form.id}` : 'New announcement'}</h2>
        <div>
          <label htmlFor="a-title" className="text-sm font-medium">Title</label>
          <input id="a-title" required maxLength={120} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} />
        </div>
        <div>
          <label htmlFor="a-body" className="text-sm font-medium">Text</label>
          <textarea id="a-body" required maxLength={1000} rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className={input} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="a-kind" className="text-sm font-medium">Type</label>
            <select id="a-kind" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as AnnouncementKind })} className={input}>
              <option value="advisory">Advisory</option>
              <option value="news">News</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label htmlFor="a-exp" className="text-sm font-medium">Hide after (optional)</label>
            <input id="a-exp" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="a-link" className="text-sm font-medium">Official source link (https://)</label>
          <input id="a-link" type="url" maxLength={300} placeholder="https://www.facebook.com/..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
          Published (shown on the home page)
        </label>
        {error && <p role="alert" className="text-sm text-error-700">{error}</p>}
        <div className="flex gap-2">
          <button className="rounded-md bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600">{form.id ? 'Save changes' : 'Post'}</button>
          {form.id && <button type="button" onClick={() => setForm(EMPTY)} className="rounded-md border border-gray-300 px-4 py-2">Cancel</button>}
        </div>
      </form>

      <div>
        <h2 className="mb-3 font-semibold text-gray-900">All announcements</h2>
        {items === null ? (
          <p className="text-gray-600">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">None yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map(a => (
              <li key={a.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="capitalize">{a.kind}</span>
                  <span>· {a.published ? 'published' : 'draft'}</span>
                  {a.expiresAt && <span>· hides {new Date(a.expiresAt).toLocaleString('en-PH')}</span>}
                </div>
                <p className="mt-1 font-semibold text-gray-900">{a.title}</p>
                <p className="text-sm text-gray-700">{a.body}</p>
                <div className="mt-2 flex gap-3 text-sm">
                  <button
                    onClick={() =>
                      setForm({
                        id: a.id,
                        title: a.title,
                        body: a.body,
                        kind: a.kind,
                        link: a.link ?? '',
                        published: a.published,
                        expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
                      })
                    }
                    className="font-semibold text-primary-600"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(a.id)} className="flex items-center gap-1 text-error-700">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [tab, setTab] = useState<'reports' | 'announcements'>('reports');

  const signOut = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const onAuthError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) signOut();
      else console.error(e);
    },
    [signOut]
  );

  return (
    <>
      <SEO title="Moderators" noindex />
      {!session ? (
        <Login onLogin={setSession} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Moderator console</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              Signed in as <strong>{session.name}</strong>
              <button onClick={signOut} className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </div>
          </div>
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {(['reports', 'announcements'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2 font-medium capitalize', tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-600')}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'reports' ? (
            <Reports token={session.token} onAuthError={onAuthError} />
          ) : (
            <Announcements token={session.token} onAuthError={onAuthError} />
          )}
        </div>
      )}
    </>
  );
}
