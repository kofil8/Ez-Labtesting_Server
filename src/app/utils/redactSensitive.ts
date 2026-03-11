const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|sessionkey|email|phone|firstName|lastName|dob|dateOfBirth|address|zip|patient|accesspayload|medical|allerg|medication|requisition)/i;

const maskValue = (value: unknown) => {
  if (typeof value !== 'string') return '[REDACTED]';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
};

export const redactSensitive = (input: unknown): unknown => {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item));
  }

  if (typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = maskValue(value);
      } else {
        output[key] = redactSensitive(value);
      }
    }
    return output;
  }

  return input;
};

export const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return redactSensitive(error) as Record<string, unknown>;
  }

  return { message: String(error) };
};
