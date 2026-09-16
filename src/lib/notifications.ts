export type InAppNotification = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

export type NotificationsResponse = {
  items: InAppNotification[];
  unreadCount: number;
};

/**
 * The notifications endpoint answers with { notifications, unread }, while callers work in
 * terms of { items, unreadCount }. Reading the raw response directly yields undefined and
 * crashes the page, so every caller goes through this instead.
 */
export function normalizeNotificationsResponse(value: unknown): NotificationsResponse {
  if (!value || typeof value !== 'object') {
    return { items: [], unreadCount: 0 };
  }

  const record = value as Record<string, unknown>;
  const itemsCandidate = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.notifications)
      ? record.notifications
      : Array.isArray(record.data)
        ? record.data
        : [];

  const items = itemsCandidate.filter((item): item is InAppNotification => {
    return Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item);
  });

  const unreadCount = typeof record.unreadCount === 'number'
    ? record.unreadCount
    : typeof record.unread_count === 'number'
      ? record.unread_count
      : typeof record.unread === 'number'
        ? record.unread
        : items.filter((item) => !item.readAt).length;

  return { items, unreadCount };
}
