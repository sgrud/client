import { BusHandler } from '@sgrud/bus';
import { BehaviorSubject, catchError, of, Subject, throwError, timeout } from 'rxjs';

describe('@sgrud/bus/handler/handler', () => {

  describe('instantiating a handler', () => {
    const handler = new BusHandler();

    it('returns the singleton handler', () => {
      expect(handler).toBe(new BusHandler());
    });
  });

  describe('subscribing to a Subject bus', () => {
    const handler = new BusHandler();
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

  describe('subscribing to a BehaviorSubject bus', () => {
    const handler = new BusHandler();
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

  describe('subscribing to an empty bus', () => {
    const handler = new BusHandler();
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

  describe('pushing an error through a bus', () => {
    const handler = new BusHandler();
    const exception = throwError(() => null);

    it('emits the error to the observer', (done) => {
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
