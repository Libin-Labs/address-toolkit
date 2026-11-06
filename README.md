# @lp-labs/address-toolkit

Validate and format addresses using schemas supplied by your application. No country catalog,
postal database, geocoder, or address-verification service is bundled.

## Install and quick start

```sh
npm install @lp-labs/address-toolkit
```

```js
import { createAddressSchema } from '@lp-labs/address-toolkit';

const usAddress = createAddressSchema({
  countryCode: 'US',
  fields: [
    { name: 'line1', label: 'Street', required: true },
    { name: 'city', label: 'City', required: true },
    { name: 'region', label: 'State', required: true, maxLength: 2 },
    { name: 'postalCode', label: 'ZIP code', required: true, pattern: '^\\d{5}$' },
  ],
  lines: [['line1'], ['city', 'region', 'postalCode']],
});
console.log(
  usAddress.format({ line1: '1 Main St', city: 'Springfield', region: 'IL', postalCode: '62701' }),
);
```

## API

- `createAddressSchema(schema)` validates schema structure and returns an `AddressFormatter`.
- `formatter.validate(input)` trims field values and returns a normalized value plus field issues;
  unknown input keys are reported.
- `formatter.format(input)` validates before joining configured fields into lines and throws
  `TypeError` for invalid input.
- `AddressSchema`, `AddressField`, `Address`, `AddressIssue`, `AddressValidation`, and
  `AddressFormatter` are exported types.

Country codes must be uppercase two-letter codes. Fields have unique safe names, labels, optional
required/max-length/pattern constraints, and formatting lines may refer only to declared fields.
Patterns are JavaScript regular expressions and apply to the trimmed value. Malformed schema/input
throws `TypeError` or `RangeError`; field-level failures are returned by `validate`.

## Limits and customization

Provide the relevant fields, validation policy, and line ordering for each country or application.
The package does not claim complete world coverage, canonical postal formats, address correctness,
deliverability, or verification. Patterns are caller-supplied policy, not authoritative country
rules. Patterns run synchronously as JavaScript regular expressions and should come from trusted
configuration; keep their shape and input bounds appropriate for your application. There are no
runtime or peer dependencies.

ESM, CommonJS, and TypeScript declarations are included. TypeScript and Prettier are development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
