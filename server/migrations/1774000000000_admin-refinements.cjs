exports.up = (pgm) => {
    // 1. Add file_size to tracks
    pgm.addColumn('tracks', {
        file_size: { type: 'bigint', default: 0 }
    });

    // 2. Add unique constraint to reviews (user_id, version)
    // First, let's delete potential duplicates to ensure the index can be created
    // (In a real production environment, we'd handle this more carefully)
    pgm.sql(`
        DELETE FROM reviews a USING (
            SELECT MIN(id) as id, user_id, version 
            FROM reviews 
            GROUP BY user_id, version 
            HAVING COUNT(*) > 1
        ) b
        WHERE a.user_id = b.user_id AND a.version = b.version AND a.id <> b.id
    `);

    pgm.addConstraint('reviews', 'unique_user_version_review', {
        unique: ['user_id', 'version']
    });
};

exports.down = (pgm) => {
    pgm.dropConstraint('reviews', 'unique_user_version_review');
    pgm.dropColumn('tracks', 'file_size');
};
