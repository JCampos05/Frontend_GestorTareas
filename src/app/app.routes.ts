import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: 'landing', loadComponent: () => import('./paginas/landing-page/landing-page').then(m => m.LandingPageComponent)},
    {path: 'login', loadComponent: () => import('./authentication/login/login').then(m => m.LoginComponent)},
    {path: 'registrate', loadComponent: () => import('./authentication/crear-cuenta/crear-cuenta').then(m => m.Registrate)},
    {path: 'app', loadComponent: () => import('./paginas/main-layout/main-layout').then(m => m.MainLayoutComponent),
        children: [
            {path: '', redirectTo: 'mi-dia', pathMatch: 'full'},
            {path: 'mi-dia', loadComponent: () => import('./paginas/main-layout/mi-dia/mi-dia').then(m =>m.MiDiaComponent)},
            {path: 'todas-tareas', loadComponent: () => import('./paginas/main-layout/todas-tareas/todas-tareas').then(m => m.TodasTareasComponent)},
            {path: 'pendientes', loadComponent: () => import('./paginas/main-layout/pendientes/pendientes').then(m => m.PendientesComponent)},
            {path: 'progreso', loadComponent: () => import('./paginas/main-layout/progreso/progreso').then(m => m.ProgresoComponent)},
            {path: 'completadas', loadComponent: () => import('./paginas/main-layout/completadas/completadas').then(m => m.CompletadasComponent)},
            {path: 'vencidas', loadComponent: () => import('./paginas/main-layout/vencidas/vencidas').then(m => m.VencidasComponent)},
            {path: 'listas-individuales' , loadComponent: () => import('./paginas/main-layout/listas-individuales/listas-individuales').then(m =>m.ListasIndividualesComponent)},
            {path: 'listas-importantes' , loadComponent: () => import('./paginas/main-layout/listas-importantes/listas-importantes').then(m => m.ListasImportantesComponent)},
            {path: 'lista/:id', loadComponent: () => import('./paginas/main-layout/detalles-lista/detalles-lista').then(m => m.DetalleListaComponent)},
            {path: 'notas', loadComponent: () => import('./paginas/notas/notas').then(m => m.Notas)},
            {path: 'operator', loadComponent: () => import('./componentes/operator-section/operator-section').then(m => m.AdminSectionsComponent)}
        ]
    },
    {path: 'compartida/:id', loadComponent: () => import('./paginas/lista-compartida/lista-compartida').then(m => m.ListaCompartida)},
    {path: '', redirectTo: 'landing', pathMatch: 'full'},
    {path: '**', redirectTo: 'landing'}
];