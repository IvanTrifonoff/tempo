exports.up = (pgm) => {
    pgm.addColumns('users', {
        can_download: { type: 'boolean', notNull: true, default: false }
    });

    // Set existing admins/coaches as premium by default (optional, but helpful for testing)
    pgm.sql("UPDATE users SET can_download = true WHERE role IN ('admin', 'coach')");
};

exports.down = (pgm) => {
    pgm.dropColumns('users', ['can_download']);
};
