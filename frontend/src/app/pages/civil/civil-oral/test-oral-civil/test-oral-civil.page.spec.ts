import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestOralCivilPage } from './test-oral-civil.page';

describe('TestOralCivilPage', () => {
  let component: TestOralCivilPage;
  let fixture: ComponentFixture<TestOralCivilPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestOralCivilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
