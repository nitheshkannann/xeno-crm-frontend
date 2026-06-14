
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}


export function getHealthLabelClass(label: string): string {
  switch (label) {
    case 'HIGHLY_LOYAL': return 'health-highly-loyal';
    case 'ACTIVE': return 'health-active';
    case 'AT_RISK': return 'health-at-risk';
    case 'CHURN_RISK': return 'health-churn-risk';
    default: return 'health-churn-risk';
  }
}

export function getHealthLabelText(label: string): string {
  switch (label) {
    case 'HIGHLY_LOYAL': return 'Highly Loyal';
    case 'ACTIVE': return 'Active';
    case 'AT_RISK': return 'At Risk';
    case 'CHURN_RISK': return 'Churn Risk';
    default: return label;
  }
}

export function getCampaignStatusClass(status: string): string {
  switch (status) {
    case 'RUNNING': return 'badge-running';
    case 'COMPLETED': return 'badge-completed';
    case 'DRAFT': return 'badge-draft';
    case 'FAILED': return 'badge-failed';
    case 'SCHEDULED': return 'badge-scheduled';
    default: return 'badge-draft';
  }
}
