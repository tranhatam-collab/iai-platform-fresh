export interface SmtpError extends Error {
  responseCode?: number;
}

export function createSmtpError(message: string, responseCode: number) {
  const error = new Error(message) as SmtpError;
  error.responseCode = responseCode;
  return error;
}

export function getSmtpErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "responseCode" in error &&
    typeof (error as SmtpError).responseCode === "number"
  ) {
    return (error as SmtpError).responseCode;
  }

  return undefined;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown SMTP runtime error";
}
