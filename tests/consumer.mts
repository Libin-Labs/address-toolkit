import { createAddressSchema, type AddressValidation } from '@lp-labs/address-toolkit';
const schema = createAddressSchema({
  countryCode: 'CA',
  fields: [{ name: 'city', label: 'City' }],
});
const result: AddressValidation = schema.validate({ city: 'Ottawa' });
// @ts-expect-error country codes are supplied as strings.
createAddressSchema({ countryCode: 1, fields: [] });
void result;
