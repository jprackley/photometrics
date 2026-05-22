const MIN = {
    THEME: 0,
    ACCENTCOLOR: 0,
    LANGUAGE: 0,
    TIMEZONE: 0,
}

const MAX = {
    THEME: 255,
    ACCENTCOLOR: 255,
    LANGUAGE: 255,
    TIMEZONE: 255,
}

const REQUIRED_COLUMNS = {
    USER_ID: 'user_id',
};

const MUTABLE_COLUMNS = {
    THEME: 'theme',
    ACCENTCOLOR: 'accentColor',
    COMPACTTABLES: 'compactTables',
    DASHBOARDTIPS: 'showDashboardTips',
    NOTIFICATIONS: 'notifications',
    COMPANYNAME: 'companyName',
    LANGUAGE: 'language',
    TIMEZONE: 'timezone',
    UPDATED: 'updated_at'
}

const IMMUTABLE_COLUMNS = {
    ID: 'setting_id',
    CREATED: 'created_at',
}

module.exports = {
    REQUIRED_COLUMNS, MUTABLE_COLUMNS, IMMUTABLE_COLUMNS, MIN, MAX,
}