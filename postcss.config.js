export default {
  plugins: {
    // Tailwind v4 ships its own vendor-prefixer, so running autoprefixer after
    // it only duplicates prefixes and slows the build.
    '@tailwindcss/postcss': {},
  },
};
