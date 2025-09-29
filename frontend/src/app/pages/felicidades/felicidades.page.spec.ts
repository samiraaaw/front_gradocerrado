import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FelicidadesPage } from './felicidades.page';

describe('FelicidadesPage', () => {
  let component: FelicidadesPage;
  let fixture: ComponentFixture<FelicidadesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FelicidadesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
