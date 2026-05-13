exports.up = (pgm) => {
  pgm.createTable('changelogs', {
    version: { type: 'text', primaryKey: true },
    release_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    description_ru: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('changelogs', { ifExists: true });
};
