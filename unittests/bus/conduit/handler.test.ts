import { ConduitHandler } from '@sgrud/bus';
import { BehaviorSubject, Subject } from 'rxjs';

describe('@sgrud/bus/conduit/handler', () => {

  describe('creating a new handler', () => {
    const handler = new ConduitHandler();

    it('returns the singleton handler', () => {
      expect(handler).toBe(new ConduitHandler());
    });
  });

  describe('creating and subscribing to a Subject conduit', () => {
    it('observes values emitted within its parent handle', (done) => {
      const handler = new ConduitHandler();
      const subject = new Subject<number>();

      const one = handler.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.subject');
        expect(value).toBe(0);
        one.unsubscribe();
      });

      one.add(() => {
        subject.complete();
        done();
      });

      handler.set('sgrud.bus.test.subject', subject);
      setTimeout(() => subject.next(0), 1000);
    });
  });

  describe('creating and subscribing to a BehaviorSubject conduit', () => {
    it('observes values emitted within its parent handle', (done) => {
      const handler = new ConduitHandler();
      const behaviorSubject = new BehaviorSubject<number>(1);

      const one = handler.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        one.unsubscribe();
      });

      const two = handler.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.behaviorSubject');
        expect(value).toBe(behaviorSubject.value);
        if (value === 2) two.unsubscribe();
      });

      two.add(() => {
        behaviorSubject.complete();
        done();
      });

      handler.set('sgrud.bus.test.behaviorSubject', behaviorSubject);
      setTimeout(() => behaviorSubject.next(2), 1000);
    });
  });

});
