/**
 * **Worker** wildcard module declaration. Allows inlining **worker** code by
 * importing the synthetic default export of a source file prefixed with
 * `worker:`.
 *
 * @example 
 * Inline a WebWorker:
 * ```ts
 * import WebWorkerThread from 'worker:./web-worker';
 * ```
 */
declare module 'worker:*' {
  export default WorkerFactory;
  const WorkerFactory: new (...args: any[]) => Worker;
}
