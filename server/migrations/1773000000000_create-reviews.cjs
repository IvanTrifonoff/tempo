exports.up = (pgm) => {
    pgm.createTable('reviews', {
        id: 'id',
        user_id: { type: 'text', notNull: true, references: '"users"', onDelete: 'cascade' },
        rating: { type: 'integer', notNull: true, check: 'rating >= 1 AND rating <= 5' },
        comment: { type: 'text' },
        version: { type: 'text', notNull: true },
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    }, { ifNotExists: true });

    // Index for checking user review status
    pgm.createIndex('reviews', 'user_id');
};

exports.down = (pgm) => {
    pgm.dropTable('reviews', { ifExists: true });
};
