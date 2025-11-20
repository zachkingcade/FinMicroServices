import { TestBed } from '@angular/core/testing';

import { Campfire } from './campfire';

describe('Campfire', () => {
  let service: Campfire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Campfire);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
