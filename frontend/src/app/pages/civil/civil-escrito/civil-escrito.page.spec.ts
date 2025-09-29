import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CivilEscritoPage } from './civil-escrito.page';

describe('CivilEscritoPage', () => {
  let component: CivilEscritoPage;
  let fixture: ComponentFixture<CivilEscritoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CivilEscritoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
