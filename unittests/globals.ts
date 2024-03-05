import { CoverageInstrumenter } from 'collect-v8-coverage';

/**
 * Fix drop in Node v20.10.0 coverage collection.
 *
 * @remarks https://github.com/SimenB/collect-v8-coverage/issues/222
 */
export default async function() {
  CoverageInstrumenter.prototype.stopInstrumenting = async function(this: any) {
    return (await this.postSession('Profiler.takePreciseCoverage')).result;
  };
}
