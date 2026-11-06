import test from 'node:test';
import assert from 'node:assert/strict';
import { createAddressSchema } from '../dist/esm/index.js';

const schema = createAddressSchema({
  countryCode: 'US',
  fields: [
    { name: 'street', label: 'Street', required: true },
    { name: 'city', label: 'City', required: true },
    { name: 'region', label: 'State', required: true, maxLength: 2 },
    { name: 'postal', label: 'ZIP', pattern: '^\\d{5}$' },
  ],
  lines: [['street'], ['city', 'region', 'postal']],
});

test('normalizes caller-provided fields and formats configured lines', () => {
  const input = { street: ' 1 Main St ', city: ' Springfield ', region: 'IL', postal: '62701' };
  assert.equal(schema.validate(input).valid, true);
  assert.equal(schema.format(input), '1 Main St\nSpringfield, IL, 62701');
});

test('reports required, pattern, and unknown-field errors without guessing policy', () => {
  const result = schema.validate({
    street: '',
    city: 'Town',
    region: 'Illinois',
    postal: 'bad',
    extra: 'x',
  });
  assert.equal(result.valid, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['unknown-field', 'required', 'too-long', 'pattern'],
  );
  assert.throws(() => schema.format({}), TypeError);
});

test('rejects malformed caller-supplied schemas and non-string values', () => {
  assert.throws(
    () => createAddressSchema({ countryCode: 'USA', fields: [{ name: 'x', label: 'X' }] }),
    TypeError,
  );
  assert.throws(
    () =>
      createAddressSchema({
        countryCode: 'US',
        fields: [
          { name: 'x', label: 'X' },
          { name: 'x', label: 'Again' },
        ],
      }),
    TypeError,
  );
  assert.equal(schema.validate({ street: 4 }).issues[0].code, 'type');
});
