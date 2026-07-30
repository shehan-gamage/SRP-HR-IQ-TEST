/**
 * SRP group companies a candidate can be invited under. The selected name is
 * stored on the candidate and appears in the invite email, admin views, CSV
 * export and receipt. Edit this list to add or retire companies; stored
 * candidates keep the name they were invited under.
 */
export const COMPANIES = [
  'S R P International - FZCO',
  'S R P International (Private) Limited',
  'S R P International Accounting Services (Private) Limited',
  'S R P International Human Resources (Private) Limited',
  'S R P International Research (Private) Limited',
  'S R P International Services (Private) Limited',
  'S R P Solutions (Private) Limited',
];

/** Display fallback for records created before the company field existed. */
export function companyOrDefault(value: string | null | undefined): string {
  return (value ?? '').trim() || 'SRP International';
}
