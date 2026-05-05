const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    in_progress: 'badge bg-violet-100 text-violet-700',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    no_show: 'badge bg-gray-100 text-gray-600',
  };
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return <span className={`badge ${styles[status] || 'badge-neutral'}`}>{labels[status] || status}</span>;
};

const PaymentBadge = ({ status }) => {
  const styles = {
    pending: 'badge-warning',
    completed: 'badge-success',
    failed: 'badge-danger',
    refunded: 'badge-info',
  };
  return <span className={`badge ${styles[status] || 'badge-neutral'}`}>{status}</span>;
};

const UrgencyBadge = ({ urgency }) => {
  const styles = {
    low: 'badge bg-green-100 text-green-700',
    medium: 'badge-warning',
    high: 'badge bg-orange-100 text-orange-700',
    emergency: 'badge-danger',
  };
  return <span className={`${styles[urgency] || 'badge-neutral'}`}>{urgency}</span>;
};

export { StatusBadge, PaymentBadge, UrgencyBadge };
