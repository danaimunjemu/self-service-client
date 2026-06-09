import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosmanMerchantOnboardingComponent } from './posman-merchant-onboarding.component';

describe('PosmanMerchantOnboardingComponent', () => {
  let component: PosmanMerchantOnboardingComponent;
  let fixture: ComponentFixture<PosmanMerchantOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PosmanMerchantOnboardingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosmanMerchantOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
