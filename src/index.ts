export interface AddressField {
  name: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
}

export interface AddressSchema {
  countryCode: string;
  fields: readonly AddressField[];
  lines?: readonly (readonly string[])[];
}

export interface Address {
  readonly [field: string]: string | undefined;
}

export interface AddressIssue {
  field: string;
  code: 'unknown-field' | 'required' | 'type' | 'too-long' | 'pattern';
  message: string;
}

export interface AddressValidation {
  valid: boolean;
  value: Readonly<Record<string, string>>;
  issues: readonly AddressIssue[];
}

export interface AddressFormatter {
  readonly countryCode: string;
  readonly fields: readonly AddressField[];
  validate(input: Address): AddressValidation;
  format(input: Address): string;
}

export function createAddressSchema(schema: AddressSchema): AddressFormatter {
  if (!schema || typeof schema !== 'object' || !/^[A-Z]{2}$/.test(schema.countryCode)) {
    throw new TypeError('countryCode must be an uppercase two-letter code.');
  }
  if (!Array.isArray(schema.fields) || schema.fields.length < 1 || schema.fields.length > 100) {
    throw new RangeError('An address schema must contain 1 to 100 fields.');
  }
  const names = new Set<string>();
  const patterns = new Map<string, RegExp>();
  const fields = schema.fields.map((field) => {
    if (
      !field ||
      typeof field.name !== 'string' ||
      !/^[A-Za-z_][\w-]{0,63}$/.test(field.name) ||
      typeof field.label !== 'string' ||
      field.label.length < 1 ||
      field.label.length > 100
    ) {
      throw new TypeError('Each field needs a valid name and non-empty label.');
    }
    if (names.has(field.name)) throw new TypeError(`Duplicate address field "${field.name}".`);
    names.add(field.name);
    const maxLength = field.maxLength ?? 200;
    if (!Number.isSafeInteger(maxLength) || maxLength < 1 || maxLength > 10_000) {
      throw new RangeError(`maxLength for "${field.name}" must be from 1 to 10000.`);
    }
    if (field.pattern !== undefined) {
      if (typeof field.pattern !== 'string' || field.pattern.length > 500) {
        throw new TypeError(
          `pattern for "${field.name}" must be a string of at most 500 characters.`,
        );
      }
      try {
        patterns.set(field.name, new RegExp(field.pattern));
      } catch {
        throw new TypeError(`pattern for "${field.name}" is not a valid regular expression.`);
      }
    }
    if (field.required !== undefined && typeof field.required !== 'boolean') {
      throw new TypeError(`required for "${field.name}" must be a boolean.`);
    }
    return {
      name: field.name,
      label: field.label,
      required: field.required ?? false,
      maxLength,
      pattern: field.pattern,
    };
  });
  if (schema.lines !== undefined && (!Array.isArray(schema.lines) || schema.lines.length > 1000)) {
    throw new RangeError('Formatting lines must be an array containing at most 1000 lines.');
  }
  const lines =
    schema.lines?.map((line) => {
      if (
        !Array.isArray(line) ||
        line.length < 1 ||
        line.length > 100 ||
        line.some((field) => !names.has(field))
      ) {
        throw new TypeError('Each formatting line must contain known field names.');
      }
      return [...line];
    }) ?? fields.map((field) => [field.name]);
  const validate = (input: Address): AddressValidation => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new TypeError('Address input must be an object.');
    }
    const issues: AddressIssue[] = [];
    for (const name of Object.keys(input)) {
      if (!names.has(name))
        issues.push({ field: name, code: 'unknown-field', message: `Unknown field "${name}".` });
    }
    const value: Record<string, string> = Object.create(null) as Record<string, string>;
    for (const field of fields) {
      const raw = input[field.name];
      if (raw === undefined || raw === '') {
        if (field.required)
          issues.push({
            field: field.name,
            code: 'required',
            message: `${field.label} is required.`,
          });
        continue;
      }
      if (typeof raw !== 'string') {
        issues.push({
          field: field.name,
          code: 'type',
          message: `${field.label} must be a string.`,
        });
        continue;
      }
      const normalized = raw.trim();
      if (normalized.length > field.maxLength) {
        issues.push({
          field: field.name,
          code: 'too-long',
          message: `${field.label} exceeds ${field.maxLength} characters.`,
        });
      } else if (patterns.get(field.name) && !patterns.get(field.name)!.test(normalized)) {
        issues.push({
          field: field.name,
          code: 'pattern',
          message: `${field.label} has an invalid format.`,
        });
      } else if (normalized) {
        value[field.name] = normalized;
      } else if (field.required) {
        issues.push({
          field: field.name,
          code: 'required',
          message: `${field.label} is required.`,
        });
      }
    }
    return { valid: issues.length === 0, value, issues };
  };
  return {
    countryCode: schema.countryCode,
    fields: Object.freeze(fields.map((field) => Object.freeze(field))),
    validate,
    format(input) {
      const result = validate(input);
      if (!result.valid)
        throw new TypeError(
          `Invalid ${schema.countryCode} address: ${result.issues.map((issue) => issue.message).join(' ')}`,
        );
      return lines
        .map((line) =>
          line
            .map((name) => result.value[name])
            .filter(Boolean)
            .join(', '),
        )
        .filter(Boolean)
        .join('\n');
    },
  };
}
