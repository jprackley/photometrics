function buildInsert(table, body, allowedFields) {
    const columns = [];
    const values = [];
    const params = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            columns.push(field);
            params.push(body[field]);
            values.push(`$${params.length}`);
        }
    }

    return {
        sql: `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${values.join(', ')})
            RETURNING *
        `,
        params
    };
}

function buildPatch(table, body, allowedFields, idColumn, id) {
    const set = [];
    const params = [];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            params.push(body[field]);
            set.push(`${field} = $${params.length}`);
        }
    }

    if (set.length === 0) {
        return {
            sql: null,
            params: [],
            hasFields: false
        };
    }

    params.push(id);

    return {
        sql: `
            UPDATE ${table}
            SET ${set.join(', ')}, updated_at = now()
            WHERE ${idColumn} = $${params.length}
            RETURNING *
        `,
        params,
        hasFields: true
    };
}

function buildIlikeWhere(q, columns) {
    if (!q) {
        return {
            where: '',
            params: []
        };
    }

    const params = [`%${q}%`];

    const conditions = columns.map((column) => {
        return `${column} ILIKE $1`;
    });

    return {
        where: `WHERE ${conditions.join(' OR ')}`,
        params
    };
}

function getSafeSort(sort, allowedFields, fallback) {
    return allowedFields.includes(String(sort)) ? sort : fallback;
}

module.exports = {
    buildInsert,
    buildPatch,
    buildIlikeWhere,
    getSafeSort
};