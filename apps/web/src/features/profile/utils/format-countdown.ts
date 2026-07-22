/**
 * Format seconds into MM:SS countdown display
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hint text shown before an OTP has been sent
 */
export function getOtpHintText(
  isDashboardVerificationFlow: boolean,
  field: 'email' | 'phone'
): string {
  if (isDashboardVerificationFlow) {
    return `Click the button to send OTP for ${field} verification`;
  }
  return `Click the button to send OTP to this ${field}`;
}
