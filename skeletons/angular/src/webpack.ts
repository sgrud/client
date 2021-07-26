import { Configuration } from 'webpack';

export default {
  optimization: {
    runtimeChunk: false
  },
  output: {
    filename: 'sgrud-skeleton-angular.min.js'
  }
} as Configuration;
