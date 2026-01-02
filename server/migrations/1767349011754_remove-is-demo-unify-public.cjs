exports.shorthands = undefined;

exports.up = pgm => {
  // Переносим данные из is_demo в is_public (на всякий случай)
  pgm.sql('UPDATE tracks SET is_public = true WHERE is_demo = true');
  pgm.dropColumn('tracks', 'is_demo');
};

exports.down = pgm => {
  pgm.addColumn('tracks', {
    is_demo: { type: 'boolean', default: false, notNull: true }
  });
};
