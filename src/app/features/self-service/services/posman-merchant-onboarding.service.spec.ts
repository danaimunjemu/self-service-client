import { TestBed } from '@angular/core/testing';

import { PosmanMerchantOnboardingService } from './posman-merchant-onboarding.service';

describe('PosmanMerchantOnboardingService', () => {
  let service: PosmanMerchantOnboardingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PosmanMerchantOnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
