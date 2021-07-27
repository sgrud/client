import { Configuration } from 'webpack';
import packageJson from '../package.json';

export default {
  optimization: {
    runtimeChunk: false
  },
  output: {
    filename: packageJson.name + '.min.js'
  }
} as Configuration;
