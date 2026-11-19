/** Why a PDF couldn't be imported, in words for the person importing it. */
export type PdfReadFailure = 'password' | 'invalid' | 'no-text';

export class PdfReadError extends Error {
  constructor(
    readonly reason: PdfReadFailure,
    message: string,
  ) {
    super(message);
  }
}

export const PDF_FAILURE_MESSAGES: Record<PdfReadFailure, string> = {
  password: 'This PDF is password-protected. Remove the password and try again.',
  invalid: "This file isn't a readable PDF. It may be damaged or not a PDF at all.",
  'no-text':
    "This PDF is a picture of a page (a scan or a photo), so there's no text to read. Import the original file instead, or retype it.",
};
