import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: '', redirectTo: 'tareas', pathMatch: 'full'},
    {path: 'tareas', loadComponent: () => import('./componentes/columna/columna'). then(m =>m.ColumnasComponent)},
    {path: 'operator', loadComponent: () => import('./componentes/operator-section/operator-section').then(m => m.AdminSectionsComponent)},
    {path: 'lista/:id', loadComponent: () => import('./componentes/columna/columna').then(m => m.ColumnasComponent)}
];
