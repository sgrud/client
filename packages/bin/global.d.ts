declare module 'worker:*' {
  const WorkerFactory: new (...args: any[]) => Worker;
  export default WorkerFactory;
}

declare namespace NodeJS {
  interface Module {
    constructor: new (
      ...args: ConstructorParameters<typeof Module>
    ) => InstanceType<Module>;
  }
}
