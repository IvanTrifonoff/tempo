exports.up = (pgm) => {
    pgm.createTable('activity_logs', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: { type: 'text', references: '"users"', onDelete: 'SET NULL' },
        action: { type: 'text', notNull: true },
        target_id: { type: 'text' },
        details: { type: 'jsonb' },
        ip_address: { type: 'text' },
        user_agent: { type: 'text' },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Индексы для быстрого поиска по пользователю и типу действия
    pgm.createIndex('activity_logs', 'user_id');
    pgm.createIndex('activity_logs', 'action');
    pgm.createIndex('activity_logs', 'created_at');
};

exports.down = (pgm) => {
    pgm.dropTable('activity_logs');
};
