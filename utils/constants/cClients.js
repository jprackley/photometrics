
const CREATED_COLUMNS = {
    FIRST_NAME: 'first_name',
    MIDDLE_NAME: 'middle_name',
    LAST_NAME: 'last_name',
    TITLE: 'title',
    COMPANY_NAME: 'company_name',
    EMAIL: 'email',
    PHONE_NUMBER: 'phone_number',
    WEBSITE: 'website',
    NOTES: 'notes',
    ADDRESS_LINE1: 'address_line1',
    ADDRESS_LINE2: 'address_line2',
    CITY: 'city',
    STATE: 'state',
    POSTAL_CODE: 'postal_code',
    COUNTRY: 'country',
    BILLING_ADDRESS_LINE1: 'billing_address_line1',
    BILLING_ADDRESS_LINE2: 'billing_address_line2',
    BILLING_CITY: 'billing_city',
    BILLING_STATE: 'billing_state',
    BILLING_POSTAL_CODE: 'billing_postal_code',
    BILLING_COUNTRY: 'billing_country',
};
const UPDATED_COLUMNS = {
    CLIENT_ID: "client_id",
    CREATED_AT: "created_at",
    UPDATED_AT: "updated_at"
}
const MIN_LENGTH = {
    FIRST_NAME: 1,
    MIDDLE_NAME: 0,
    LAST_NAME: 1,
    TITLE: 0,
    COMPANY_NAME: 1,
    EMAIL: 1,
    PHONE: 0,
    WEBSITE: 0,
    NOTES: 0,
    ADDRESS_LINE: 0,
    CITY: 0,
    STATE: 0,
    ZIP: 0,
    COUNTRY: 0,
}
const MAX_LENGTH = {
    FIRST_NAME: 100,
    MIDDLE_NAME: 100,
    LAST_NAME: 100,
    TITLE: 100,
    COMPANY_NAME: 255,
    EMAIL: 255,
    PHONE: 20,
    WEBSITE: 255,
    NOTES: 5000,
    ADDRESS_LINE: 255,
    CITY: 100,
    STATE: 100,
    ZIP: 20,
    COUNTRY: 100,
}

module.exports = { CREATED_COLUMNS, UPDATED_COLUMNS, MIN_LENGTH, MAX_LENGTH };