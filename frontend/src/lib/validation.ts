export function isValidMobileNumber(v: string): boolean {
  return /^09\d{9}$/.test(v.replace(/\s/g, ''));
}

export function formatMobileNumber(v: string): string {
  return v.replace(/[^0-9]/g, '').slice(0, 11);
}

export function isValidPhilsysCardNo(v: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(v);
}

export function formatPhilsysCardNo(v: string): string {
  const d = v.replace(/[^0-9]/g, '').slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1-');
}
