import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenTestCivilOralPage } from './resumen-test-civil-oral.page';

describe('ResumenTestCivilOralPage', () => {
  let component: ResumenTestCivilOralPage;
  let fixture: ComponentFixture<ResumenTestCivilOralPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResumenTestCivilOralPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
