exports.up = (pgm) => {
  // 1. Расширение таблицы пользователей
  // pgm.addColumns не поддерживает ifNotExists напрямую в объекте колонок в некоторых версиях, 
  // поэтому используем нативный SQL для надежности при "починке" тестового инстанса
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS track_limit INTEGER DEFAULT 10 NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
  `);

  // 2. Создание таблицы логов аудита
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    admin_id: { type: 'text', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    action: { type: 'text', notNull: true },
    target_id: { type: 'text' },
    details: { type: 'jsonb' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  // Индексы
  pgm.createIndex('audit_logs', 'admin_id', { ifNotExists: true });
  pgm.createIndex('audit_logs', 'action', { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs', { ifExists: true });
  pgm.dropColumns('users', ['track_limit', 'subscription_tier', 'is_banned', 'last_login'], { ifExists: true });
};
