import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import stylelint from 'stylelint';

export default {
  plugins: [
    postcssImport({
      plugins: [stylelint]
    }),
    postcssPresetEnv({
      autoprefixer: { grid: true },
      features: {
        'nesting-rules': true
      }
    })
  ]
};
