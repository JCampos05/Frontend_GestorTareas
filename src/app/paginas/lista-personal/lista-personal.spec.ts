import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPersonal } from './lista-personal';

describe('ListaPersonal', () => {
  let component: ListaPersonal;
  let fixture: ComponentFixture<ListaPersonal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPersonal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaPersonal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
