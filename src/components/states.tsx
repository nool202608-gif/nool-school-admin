export function LoadingState({ label }: { label: string }) {
  return (
    <div>
      <div className="skeleton-row" style={{ width: '40%' }} />
      <div className="skeleton-row" />
      <div className="skeleton-row" style={{ width: '70%' }} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-card error">
      <b>{title}</b>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn dark sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="state-card">
      <b>{title}</b>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" className="btn yellow sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
