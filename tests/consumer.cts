import address = require('@lp-labs/address-toolkit');
const city: string = address
  .createAddressSchema({
    countryCode: 'GB',
    fields: [{ name: 'city', label: 'Town' }],
  })
  .format({ city: 'York' });
void city;
