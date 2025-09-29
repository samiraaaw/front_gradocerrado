import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CivilPage } from './civil.page';

describe('CivilPage', () => {
  let component: CivilPage;
  let fixture: ComponentFixture<CivilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CivilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
