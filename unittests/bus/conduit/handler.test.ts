import { ConduitHandler } from '@sgrud/bus';
import { BehaviorSubject, catchError, of, Subject, throwError, timeout } from 'rxjs';

describe('@sgrud/bus/conduit/handler', () => {

  describe('instantiating a handler', () => {
    const handler = new ConduitHandler();

    it('returns the singleton handler', () => {
      expect(handler).toBe(new ConduitHandler());
    });
  });

  describe('subscribing to a Subject conduit', () => {
    const handler = new ConduitHandler();
    const subject = new Subject<string>();

    it('observes values emitted within its parent handle', (done) => {
      const subscription = handler.get('sgrud.test.bus').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.subject');
        expect(value).toBe('done');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        subject.complete();
        done();
      });

      handler.set('sgrud.test.bus.subject', subject);
      setTimeout(() => subject.next('done'), 250);
    });
  });

  describe('subscribing to a BehaviorSubject conduit', () => {
    const handler = new ConduitHandler();
    const behaviorSubject = new BehaviorSubject<string>('default');

    it('observes values emitted within its parent handle', (done) => {
      const subscriptionOne = handler.get('sgrud.test.bus').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        subscriptionOne.unsubscribe();
      });

      const subscriptionTwo = handler.get('sgrud.test.bus').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        if (value === 'done') subscriptionTwo.unsubscribe();
      });

      subscriptionTwo.add(() => {
        behaviorSubject.complete();
        done();
      });

      handler.set('sgrud.test.bus.behaviorSubject', behaviorSubject);
      setTimeout(() => behaviorSubject.next('done'), 250);
    });
  });

  describe('subscribing to an empty conduit', () => {
    const handler = new ConduitHandler();
    const subject = new Subject<string>();

    it('does not emit any values', (done) => {
      const subscription = handler.get('sgrud.test.bus.nonexistent').pipe(
        timeout(250),
        catchError((error) => of({
          handle: null,
          value: error
        }))
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBeNull();
        expect(value).toBeInstanceOf(Error);
        subscription.unsubscribe();
      });

      subscription.add(() => {
        subject.complete();
        done();
      });

      handler.set('sgrud.test.bus.subject', subject);
      setTimeout(() => subject.next('done'), 250);
    });
  });

  describe('pushing an error through a conduit', () => {
    const handler = new ConduitHandler();
    const exception = throwError(() => null);

    it('', (done) => {
      const subscription = handler.get('sgrud.test.bus.error').pipe(
        catchError((error) => of({
          handle: null,
          value: error
        }))
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBeNull();
        expect(value).toBeNull();
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.error', exception);
    });
  });

});
