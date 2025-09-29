import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RachaPage } from './racha.page';

describe('RachaPage', () => {
  let component: RachaPage;
  let fixture: ComponentFixture<RachaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RachaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
