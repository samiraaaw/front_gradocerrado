import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CivilOralPage } from './civil-oral.page';

describe('CivilOralPage', () => {
  let component: CivilOralPage;
  let fixture: ComponentFixture<CivilOralPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CivilOralPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
