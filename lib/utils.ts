// Utility functions
// Note: clsx and tailwind-merge are no longer needed with MUI
// Keeping this file for any future utility functions

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}
