export default {
    plugins: {
        '@tailwindcss/postcss': {
            content: ["./resources/js/**/*.jsx", "./resources/views/**/*.blade.php"],
            important: true
        },

        // @ prefixer: {},
        autoprefixer: {
        },
    },
};
