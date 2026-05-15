import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Shield,
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  CalendarPlus,
  Calendar,
  ChevronRight,
  Crown,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input, Label, Textarea } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUiStore } from '../store/uiStore';
import type { Session, User } from '../types';
import { cn } from '../lib/cn';
import { addWeeks, formatISO } from 'date-fns';

const dayOptions = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const AdminPage = () => {
  const users = useDataStore((s) => s.users);
  const sessions = useDataStore((s) => s.sessions);
  const participations = useDataStore((s) => s.participations);
  const weighIns = useDataStore((s) => s.weighIns);
  const addUser = useDataStore((s) => s.addUser);
  const updateUser = useDataStore((s) => s.updateUser);
  const removeUser = useDataStore((s) => s.removeUser);
  const createSession = useDataStore((s) => s.createSession);
  const updateSession = useDataStore((s) => s.updateSession);
  const removeSession = useDataStore((s) => s.removeSession);
  const updateParticipation = useDataStore((s) => s.updateParticipation);
  const currentAdmin = useAuthStore((s) => s.currentUser);
  const pushToast = useUiStore((s) => s.pushToast);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  const userRows = useMemo(() => {
    return users
      .filter((u) => u.role !== 'admin')
      .map((u) => {
        const userParts = participations.filter((p) => p.userId === u.id);
        const sessionCount = userParts.length;
        const totalWeighIns = weighIns.filter((w) => w.userId === u.id).length;
        return { user: u, sessionCount, totalWeighIns };
      });
  }, [users, participations, weighIns]);

  if (!currentAdmin || currentAdmin.role !== 'admin') return null;

  const handleInvite = async (input: { name: string; email: string; password: string }) => {
    try {
      const newUser = await addUser({
        name: input.name,
        email: input.email,
        password: input.password,
        role: 'user',
      });
      pushToast({
        title: `Invited ${newUser.name}`,
        description: `Email sent to ${newUser.email} (pretend).`,
        variant: 'success',
      });
    } catch (err: any) {
      pushToast({ title: err.message || 'Failed to invite user', variant: 'warning' });
    }
  };

  const handleCreateSession = async (input: Omit<Session, 'id' | 'createdBy' | 'status'>) => {
    try {
      await createSession({
        ...input,
        status: 'upcoming',
      });
      pushToast({ title: `Created ${input.name}`, variant: 'success' });
    } catch (err: any) {
      pushToast({ title: err.message || 'Failed to create session', variant: 'warning' });
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <Badge tone="grape" className="mb-3">
          <Shield size={12} /> Admin control room
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
          You run this thing.
        </h1>
        <p className="mt-2 text-ink-700 max-w-2xl">
          Invite people, kick people out (gently), edit their numbers when they fat-finger a typo,
          and spin up new sessions for the team.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Calendar size={20} className="text-grape-500" />
              Sessions
            </h2>
            <p className="text-sm text-ink-500">Active, upcoming, and completed challenges.</p>
          </div>
          <Button onClick={() => setSessionOpen(true)} leftIcon={<CalendarPlus size={16} />}>
            New session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {sessions.map((s) => {
            const partCount = participations.filter((p) => p.sessionId === s.id).length;
            return (
              <Card
                key={s.id}
                tone={s.status === 'active' ? 'sunny' : s.status === 'completed' ? 'grape' : 'default'}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge tone={s.status === 'active' ? 'lime' : s.status === 'completed' ? 'grape' : 'cream'}>
                      {s.status}
                    </Badge>
                    <h3 className="font-display text-lg font-bold mt-2">{s.name}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Starts {format(parseISO(s.startDate), 'MMM d, yyyy')} · {s.weeks} weeks
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditSession(s)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cream-50 border-2 border-ink-900/10 text-ink-700 hover:bg-ink-900/5"
                      aria-label="Edit session"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete "${s.name}"? This removes all weigh-ins.`)) {
                          await removeSession(s.id);
                          pushToast({ title: 'Session deleted', variant: 'warning' });
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-bright/10 text-rose-bright hover:bg-rose-bright/20"
                      aria-label="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-700">{s.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-ink-500 font-semibold">
                  <span>👥 {partCount} participants</span>
                  <span>📌 {dayOptions.find((d) => d.value === s.weighInDayOfWeek)?.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Crown size={20} className="text-tangerine-500" />
              Users
            </h2>
            <p className="text-sm text-ink-500">
              {userRows.length} team members invited.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} variant="secondary" leftIcon={<UserPlus size={16} />}>
            Invite member
          </Button>
        </div>

        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-100/40 border-b-2 border-ink-900/10">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Name
                  </th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Sessions
                  </th>
                  <th className="text-right px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 hidden md:table-cell">
                    Weigh-ins
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Manage
                  </th>
                </tr>
              </thead>
              <tbody>
                {userRows.map(({ user, sessionCount, totalWeighIns }) => (
                  <tr
                    key={user.id}
                    className="border-b border-ink-900/5 last:border-0 hover:bg-cream-100/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} color={user.avatarColor} size="sm" />
                        <span className="font-semibold text-ink-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-700 hidden sm:table-cell">{user.email}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{sessionCount}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums hidden md:table-cell">
                      {totalWeighIns}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditUser(user)}
                          className="inline-flex items-center gap-1 rounded-xl border-2 border-ink-900/10 bg-cream-50 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-900/5"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Remove ${user.name}? This deletes all their data.`)) {
                              await removeUser(user.id);
                              pushToast({
                                title: `${user.name} removed`,
                                variant: 'warning',
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-bright/10 px-2.5 py-1 text-xs font-semibold text-rose-bright hover:bg-rose-bright/20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(input) => {
          handleInvite(input);
          setInviteOpen(false);
        }}
      />

      <SessionDialog
        open={sessionOpen || !!editSession}
        existing={editSession}
        onClose={() => {
          setSessionOpen(false);
          setEditSession(null);
        }}
        onSubmit={async (input) => {
          if (editSession) {
            await updateSession(editSession.id, input);
            pushToast({ title: 'Session updated', variant: 'success' });
          } else {
            await handleCreateSession(input);
          }
          setSessionOpen(false);
          setEditSession(null);
        }}
      />

      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={async (patch, partUpdates) => {
          if (!editUser) return;
          await updateUser(editUser.id, patch);
          for (const { id, startWeightKg, goalWeightKg } of partUpdates) {
            await updateParticipation(id, { startWeightKg, goalWeightKg });
          }
          pushToast({ title: `${patch.name ?? editUser.name} updated`, variant: 'success' });
          setEditUser(null);
        }}
      />
    </div>
  );
};

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (input: { name: string; email: string; password: string }) => void;
}

const InviteDialog = ({ open, onClose, onInvite }: InviteDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('password');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    onInvite({ name: name.trim(), email: email.trim(), password: pwd });
    setName('');
    setEmail('');
    setPwd('password');
    setError('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <UserPlus size={20} className="text-grape-500" />
          Invite a team member
        </span>
      }
      description="They'll be added immediately. (Real email invites land when MSAL ships.)"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jamie Reyes" />
        </div>
        <div>
          <Label>Work email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefix={<Mail size={14} />}
            placeholder="jamie.reyes@unosquare.com"
          />
        </div>
        <div>
          <Label>Temporary password</Label>
          <Input value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        {error && <p className="text-sm text-rose-bright font-medium">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" rightIcon={<ChevronRight size={14} />}>
            Send invite
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

interface SessionDialogProps {
  open: boolean;
  existing: Session | null;
  onClose: () => void;
  onSubmit: (input: Omit<Session, 'id' | 'createdBy' | 'status'> & { status?: Session['status'] }) => void;
}

const SessionDialog = ({ open, existing, onClose, onSubmit }: SessionDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('8');
  const [day, setDay] = useState(1);
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState(format(addWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<Session['status']>('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setDescription(existing?.description ?? '');
    setWeeks((existing?.weeks ?? 8).toString());
    setDay(existing?.weighInDayOfWeek ?? 1);
    setNote(existing?.weighInNote ?? '');
    setStartDate(
      existing
        ? format(parseISO(existing.startDate), 'yyyy-MM-dd')
        : format(addWeeks(new Date(), 1), 'yyyy-MM-dd'),
    );
    setStatus(existing?.status ?? 'upcoming');
    setError('');
  }, [open, existing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(weeks, 10);
    if (!name.trim() || !w || w < 1 || w > 52 || !startDate) {
      setError('Name, week count (1–52), and start date are required.');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      weeks: w,
      weighInDayOfWeek: day,
      weighInNote: note.trim(),
      startDate: formatISO(new Date(startDate)),
      status,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      title={
        <span className="inline-flex items-center gap-2">
          <CalendarPlus size={20} className="text-grape-500" />
          {existing ? 'Edit session' : 'Create a new session'}
        </span>
      }
      description="Set the rules. Everyone joining will see the weigh-in day and your note."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Session name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Autumn Avalanche 2026" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this challenge all about?"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Length (weeks)</Label>
            <Input
              type="number"
              min="1"
              max="52"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
            />
          </div>
          <div>
            <Label>Weigh-in day</Label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full rounded-2xl border-2 border-ink-900/15 bg-cream-50 px-4 py-2.5 outline-none focus:border-tangerine-500 focus:ring-4 focus:ring-tangerine-300/30 text-ink-900 font-medium"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Weigh-in note</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Step on the scale before coffee. Log by end of day."
          />
        </div>
        {existing && (
          <div>
            <Label>Status</Label>
            <div className="flex gap-2">
              {(['upcoming', 'active', 'completed'] as Session['status'][]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'rounded-2xl border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
                    status === s
                      ? 'bg-ink-900 text-cream-50 border-ink-900'
                      : 'bg-cream-50 text-ink-700 border-ink-900/10 hover:bg-ink-900/5',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-rose-bright font-medium">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary">
            {existing ? 'Save changes' : 'Create session'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

interface EditUserDialogProps {
  user: User | null;
  onClose: () => void;
  onSave: (
    patch: Partial<User>,
    partUpdates: { id: string; startWeightKg: number; goalWeightKg: number }[],
  ) => void;
}

const EditUserDialog = ({ user, onClose, onSave }: EditUserDialogProps) => {
  const participations = useDataStore((s) => s.participations);
  const sessions = useDataStore((s) => s.sessions);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [parts, setParts] = useState<
    { id: string; sessionName: string; startWeightKg: string; goalWeightKg: string }[]
  >([]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setHeightCm(user.heightCm?.toString() ?? '');
    setParts(
      participations
        .filter((p) => p.userId === user.id)
        .map((p) => {
          const session = sessions.find((s) => s.id === p.sessionId);
          return {
            id: p.id,
            sessionName: session?.name ?? '—',
            startWeightKg: p.startWeightKg.toFixed(1),
            goalWeightKg: p.goalWeightKg.toFixed(1),
          };
        }),
    );
  }, [user, participations, sessions]);

  if (!user) return null;

  const close = () => {
    setName('');
    setEmail('');
    setHeightCm('');
    setParts([]);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const heightNum = heightCm.trim() ? Math.round(Number(heightCm)) : undefined;
    onSave(
      { name, email, heightCm: heightNum && heightNum >= 100 && heightNum <= 230 ? heightNum : undefined },
      parts.map((p) => ({
        id: p.id,
        startWeightKg: Number(p.startWeightKg),
        goalWeightKg: Number(p.goalWeightKg),
      })),
    );
    setName('');
    setEmail('');
    setHeightCm('');
    setParts([]);
  };

  return (
    <Dialog open={!!user} onClose={close} maxWidth="lg" title={`Edit ${user.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Height</Label>
            <Input
              type="number"
              inputMode="numeric"
              min="100"
              max="230"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              suffix="cm"
              placeholder="172"
            />
          </div>
        </div>

        <div>
          <Label>Per-session data</Label>
          <div className="space-y-2">
            {parts.length === 0 ? (
              <p className="text-sm text-ink-500">Not in any session yet.</p>
            ) : (
              parts.map((p, idx) => (
                <div
                  key={p.id}
                  className="rounded-2xl border-2 border-ink-900/10 bg-cream-50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end"
                >
                  <div className="text-sm font-semibold sm:col-span-1 truncate">{p.sessionName}</div>
                  <Input
                    type="number"
                    step="0.1"
                    value={p.startWeightKg}
                    onChange={(e) => {
                      const next = [...parts];
                      next[idx] = { ...next[idx], startWeightKg: e.target.value };
                      setParts(next);
                    }}
                    suffix="kg start"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={p.goalWeightKg}
                    onChange={(e) => {
                      const next = [...parts];
                      next[idx] = { ...next[idx], goalWeightKg: e.target.value };
                      setParts(next);
                    }}
                    suffix="kg goal"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={close} leftIcon={<X size={14} />}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary">
            Save user
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default AdminPage;
