'use client';

import type { ReactNode } from 'react';

/**
 * Bulk-action bar shown above a DataTable once rows are checkbox-selected
 * (multi-deactivate, multi-delete, etc.) - kept separate from DataGrid's
 * own toolbar since the available actions differ per entity (teachers vs
 * students vs classes) while the bar's shape stays the same everywhere.
 */
export function SelectionBar({ count, children }: { count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="selection-bar">
      <span>
        <b>{count}</b> selected
      </span>
      <div className="selection-bar-actions">{children}</div>
    </div>
  );
}
