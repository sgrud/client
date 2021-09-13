import { ConduitWorker } from '@sgrud/bus';
import { BehaviorSubject, catchError, of, Subject, timeout } from 'rxjs';

describe('@sgrud/bus/conduit/worker', () => {

  describe('creating and subscribing to a Subject conduit', () => {
    const worker = new ConduitWorker();
    const subject = new Subject<number>();

    it('observes values emitted within its parent handle', (done) => {
      const one = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.subject');
        expect(value).toBe(1);
        one.unsubscribe();
      });

      one.add(() => {
        subject.complete();
        done();
      });

      worker.set('sgrud.bus.test.subject', subject);
      setTimeout(() => subject.next(1), 1000);
    });
  });

  describe('creating and subscribing to a BehaviorSubject conduit', () => {
    const worker = new ConduitWorker();
    const behaviorSubject = new BehaviorSubject<number>(2);

    it('observes values emitted within its parent handle', (done) => {
      const one = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        one.unsubscribe();
      });

      const two = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        if (value === 3) two.unsubscribe();
      });

      two.add(() => {
        behaviorSubject.complete();
        done();
      });

      worker.set('sgrud.bus.test.behaviorSubject', behaviorSubject);
      setTimeout(() => behaviorSubject.next(3), 1000);
    });
  });

  describe('creating and subscribing to an empty conduit', () => {
    const subject = new Subject<number>();
    const worker = new ConduitWorker();

    it('does not emit any values', (done) => {
      const one = worker.get('sgrud.bus.test.nonexistent').pipe(
        timeout(2000),
        catchError(() => of({
          handle: null,
          value: new Error()
        }))
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe(null);
        expect(value).toBeInstanceOf(Error);
        one.unsubscribe();
      });

      one.add(() => {
        subject.complete();
        done();
      });

      worker.set('sgrud.bus.test.subject', subject);
      setTimeout(() => subject.next(1), 1000);
    });
  });

});
