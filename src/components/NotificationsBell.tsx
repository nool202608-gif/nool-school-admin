'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { BellIcon } from './Icon';
import { getSubscription, listStudents, listTeachers } from '@/lib/api';
import { useAsyncData } from '@/lib/useAsyncData';

/** Matches the dashboard's own upsell-banner threshold - same signal,
 * surfaced here too since not every visit lands on the dashboard. */
const NEAR_LIMIT_THRESHOLD = 0.9;

interface NotificationItem {
  id: string;
  message: string;
  href: string;
}

/**
 * Not a stored notification log - every item here is derived live from
 * data the app already has (plan usage, accounts that haven't completed
 * their first sign-in yet), the same way the dashboard's upsell banner
 * and onboarding checklist are. Reuses their SWR cache keys ('teachers',
 * 'students:', 'subscription'), so this is a free read on any page that
 * already fetched them, not a duplicate request.
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const teachersState = useAsyncData('teachers', () => listTeachers());
  const studentsState = useAsyncData('students:', () => listStudents());
  const subscriptionState = useAsyncData('subscription', () => getSubscription());

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const notifications: NotificationItem[] = [];

  if (subscriptionState.status === 'success') {
    const sub = subscriptionState.data;
    if (sub.teacherLimit > 0 && sub.teacherCount / sub.teacherLimit >= NEAR_LIMIT_THRESHOLD) {
      notifications.push({
        id: 'limit-teachers',
        message: `Near your plan's teacher limit (${sub.teacherCount} of ${sub.teacherLimit}).`,
        href: '/subscription',
      });
    }
    if (sub.studentLimit > 0 && sub.studentCount / sub.studentLimit >= NEAR_LIMIT_THRESHOLD) {
      notifications.push({
        id: 'limit-students',
        message: `Near your plan's student limit (${sub.studentCount} of ${sub.studentLimit}).`,
        href: '/subscription',
      });
    }
  }

  if (teachersState.status === 'success') {
    const count = teachersState.data.filter((t) => t.mustChangePassword).length;
    if (count > 0) {
      notifications.push({
        id: 'teachers-pending',
        message: `${count} teacher${count === 1 ? '' : 's'} ${count === 1 ? 'hasn’t' : 'haven’t'} signed in yet.`,
        href: '/teachers',
      });
    }
  }

  if (studentsState.status === 'success') {
    const count = studentsState.data.filter((s) => s.mustChangePassword).length;
    if (count > 0) {
      notifications.push({
        id: 'students-pending',
        message: `${count} student${count === 1 ? '' : 's'} ${count === 1 ? 'hasn’t' : 'haven’t'} signed in yet.`,
        href: '/students',
      });
    }
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell"
        title="Notifications"
        aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length} unread)` : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <BellIcon />
        {notifications.length > 0 ? <span className="notif-badge">{notifications.length}</span> : null}
      </button>
      {open ? (
        <div className="notif-panel" role="menu">
          <div className="notif-panel-head">Notifications</div>
          {notifications.length === 0 ? (
            <p className="notif-empty">You&apos;re all caught up.</p>
          ) : (
            notifications.map((item) => (
              <Link key={item.id} href={item.href} className="notif-item" role="menuitem" onClick={() => setOpen(false)}>
                {item.message}
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
