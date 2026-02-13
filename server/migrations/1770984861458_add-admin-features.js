export const up = (pgm) => {
  // 1. Расширение таблицы пользователей
  pgm.addColumns('users', {
    track_limit: { type: 'integer', default: 10, notNull: true },
    subscription_tier: { type: 'text', default: 'free', notNull: true }, // free, basic, pro, unlimited
    is_banned: { type: 'boolean', default: false, notNull: true },
    last_login: { type: 'timestamp' },
  });

  // 2. Создание таблицы логов аудита
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    admin_id: { type: 'text', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    action: { type: 'text', notNull: true }, // e.g., 'UPDATE_USER_LIMIT', 'BAN_USER', 'DELETE_TRACK'
    target_id: { type: 'text' },
    details: { type: 'jsonb' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Индексы для быстрого поиска в логах
  pgm.createIndex('audit_logs', 'admin_id');
  pgm.createIndex('audit_logs', 'action');
};

export const down = (pgm) => {
  pgm.dropTable('audit_logs');
  pgm.dropColumns('users', ['track_limit', 'subscription_tier', 'is_banned', 'last_login']);
};
