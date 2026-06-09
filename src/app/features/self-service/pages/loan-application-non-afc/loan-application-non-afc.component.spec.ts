import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanApplicationNonAfcComponent } from './loan-application-non-afc.component';

describe('LoanApplicationNonAfcComponent', () => {
  let component: LoanApplicationNonAfcComponent;
  let fixture: ComponentFixture<LoanApplicationNonAfcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoanApplicationNonAfcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoanApplicationNonAfcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
