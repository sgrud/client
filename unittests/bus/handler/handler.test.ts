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
    const bus = new Subject<string>();
    const handler = new BusHandler();

    it('observes values emitted within its parent handle', (done) => {
      const subscription = handler.get<string>(
        'sgrud.test.bus'
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.subject');
        expect(value).toBe('done');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        bus.complete();
        done();
      });

      handler.set('sgrud.test.bus.subject', bus).subscribe();
      setTimeout(() => bus.next('done'), 250);
    });
  });

  describe('subscribing to a BehaviorSubject bus', () => {
    const bus = new BehaviorSubject<string>('default');
    const handler = new BusHandler();

    it('observes values emitted within its parent handle', (done) => {
      const subscription = handler.get<string>(
        'sgrud.test.bus'
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.behaviorSubject');
        expect(value).toBe(bus.value);

        if (value === 'done') {
          subscription.unsubscribe();
        }
      });

      subscription.add(() => {
        bus.complete();
        done();
      });

      handler.set('sgrud.test.bus.behaviorSubject', bus).subscribe();
      setTimeout(() => bus.next('done'), 250);
    });
  });

  describe('subscribing to an empty bus', () => {
    const bus = new Subject<string>();
    const handler = new BusHandler();

    it('does not emit any values', (done) => {
      const subscription = handler.get<never>(
        'sgrud.test.bus.nonexistent'
      ).pipe(
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
        bus.complete();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.subject', bus).subscribe();
      setTimeout(() => bus.next('done'), 250);
    });
  });

  describe('pushing an error through a bus', () => {
    const bus = throwError(() => null);
    const handler = new BusHandler();

    it('emits the error to the observer', (done) => {
      const subscription = handler.get<never>(
        'sgrud.test.bus.error'
      ).pipe(
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
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.error', bus).subscribe();
    });
  });

});
