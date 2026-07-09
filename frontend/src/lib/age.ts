const INFANT_FRACTIONS: Record<number, number> = {
  0: 0, 1: 0.08, 2: 0.17, 3: 0.25, 4: 0.33, 5: 0.42,
  6: 0.50, 7: 0.58, 8: 0.67, 9: 0.75, 10: 0.83, 11: 0.92,
};

export function computeAge(dob: string | Date): number {
  if (!dob) return 0;
  const birth = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) years--;
  if (years < 0) return 0;
  if (years >= 1) return years;
  let months = monthDiff;
  if (dayDiff < 0) months--;
  if (months < 0) months = 0;
  return INFANT_FRACTIONS[months] ?? 0;
}
