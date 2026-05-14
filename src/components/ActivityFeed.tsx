import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Megaphone, Swords } from 'lucide-react';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import type { ActivityEntry, User } from '../types';

interface ActivityFeedProps {
  entries: ActivityEntry[];
  users: User[];
  currentUserId: string;
  sessionId: string;
  max?: number;
}

export const ActivityFeed = ({
  entries,
  users,
  currentUserId,
  sessionId,
  max = 5,
}: ActivityFeedProps) => {
  const usersMap = new Map(users.map((u) => [u.id, u]));
  const visible = entries
    .filter((e) => e.sessionId === sessionId)
    .slice(0, max);

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3 border-b-2 border-ink-900/5">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Megaphone size={18} className="text-tangerine-500" />
            Leaderboard activity
          </h2>
          <p className="text-sm text-ink-500">
            Position changes everyone in the session sees.
          </p>
        </div>
        <Badge tone="tangerine">{entries.filter((e) => e.sessionId === sessionId).length}</Badge>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-ink-500">
          No leaderboard shuffles yet. Be the spark.
        </div>
      ) : (
        <ul className="divide-y-2 divide-ink-900/5">
          {visible.map((e) => {
            const actor = usersMap.get(e.actorUserId);
            const target = usersMap.get(e.targetUserId);
            if (!actor || !target) return null;
            const meInvolved = currentUserId === e.actorUserId || currentUserId === e.targetUserId;
            return (
              <li
                key={e.id}
                className={meInvolved ? 'px-5 py-3.5 bg-tangerine-50' : 'px-5 py-3.5'}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <Avatar name={actor.name} color={actor.avatarColor} size="sm" />
                    <span className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-tangerine-500 text-cream-50 border-2 border-cream-50 shadow-sm">
                      <Swords size={11} />
                    </span>
                    <Avatar name={target.name} color={target.avatarColor} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="text-ink-900">
                      <span className="font-bold">
                        {currentUserId === actor.id ? 'You' : actor.name}
                      </span>{' '}
                      overtook{' '}
                      <span className="font-bold">
                        {currentUserId === target.id ? 'you' : target.name}
                      </span>
                    </p>
                    <p className="text-xs text-ink-500 tabular-nums">
                      {formatDistanceToNowStrict(parseISO(e.occurredAt), { addSuffix: true })}
                    </p>
                  </div>
                  {meInvolved && (
                    <Badge tone={currentUserId === actor.id ? 'lime' : 'rose'}>
                      {currentUserId === actor.id ? 'You moved up' : 'You moved down'}
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
