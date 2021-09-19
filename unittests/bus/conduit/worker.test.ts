import { ConduitWorker } from '@sgrud/bus';
import { BehaviorSubject, catchError, of, Subject, timeout } from 'rxjs';

describe('@sgrud/bus/conduit/worker', () => {

  describe('subscribing to a subject conduit', () => {
    const worker = new ConduitWorker();
    const subject = new Subject<string>();

    it('observes values emitted within its parent handle', (done) => {
      const subscription = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.subject');
        expect(value).toBe('done');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        subject.complete();
        done();
      });

      worker.set('sgrud.bus.test.subject', subject);
      subject.next('done');
    });
  });

  describe('subscribing to a behavior subject conduit', () => {
    const worker = new ConduitWorker();
    const behaviorSubject = new BehaviorSubject<string>('default');

    it('observes values emitted within its parent handle', (done) => {
      const subscriptionOne = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        subscriptionOne.unsubscribe();
      });

      const subscriptionTwo = worker.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        if (value === 'done') subscriptionTwo.unsubscribe();
      });

      subscriptionTwo.add(() => {
        behaviorSubject.complete();
        done();
      });

      worker.set('sgrud.bus.test.behaviorSubject', behaviorSubject);
      behaviorSubject.next('done');
    });
  });

  describe('subscribing to an empty conduit', () => {
    const subject = new Subject<string>();
    const worker = new ConduitWorker();

    it('does not emit any values', (done) => {
      const subscription = worker.get('sgrud.bus.test.nonexistent').pipe(
        timeout(1),
        catchError((error) => of({
          handle: null,
          value: error
        }))
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe(null);
        expect(value).toBeInstanceOf(Error);
        subscription.unsubscribe();
      });

      subscription.add(() => {
        subject.complete();
        done();
      });

      worker.set('sgrud.bus.test.subject', subject);
      subject.next('done');
    });
  });

});
