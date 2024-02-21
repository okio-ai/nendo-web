module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        ...(process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'staging'
            ? { cssnano: {} }
            : {})
    }
}
