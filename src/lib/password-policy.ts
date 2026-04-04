/** Client-side checks aligned with common “strong password” expectations. */

export const PASSWORD_MIN_LENGTH = 12;

export function getPasswordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("At least one symbol (not a letter or digit).");
  }
  return errors;
}

export function passwordMeetsPolicy(password: string): boolean {
  return getPasswordPolicyErrors(password).length === 0;
}
