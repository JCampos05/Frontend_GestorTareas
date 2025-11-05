import { Routes } from '@angular/router';

export const routes: Routes = [
    // ==================== RUTAS PÚBLICAS ====================
    {path: 'landing', loadComponent: () => import('./paginas/landing-page/landing-page').then(m => m.LandingPage)},
    {path: 'inicio-sesion', loadComponent: () => import('./paginas/inicio-sesion/inicio-sesion').then(m => m.InicioSesion)},
    {path: 'registrate', loadComponent: () => import('./paginas/registrate/registrate').then(m => m.Registrate)},
    {path: 'app', loadComponent: () => import('./paginas/main-layout/main-layout').then(m => m.MainLayoutComponent),
        children: [
            {path: '', redirectTo: 'todas-tareas', pathMatch: 'full'},
            {path: 'todas-tareas', loadComponent: () => import('./paginas/main-layout/todas-tareas/todas-tareas').then(m => m.TodasTareasComponent)},
            {path: 'pendientes', loadComponent: () => import('./paginas/main-layout/pendientes/pendientes').then(m => m.PendientesComponent)},
            {path: 'progreso', loadComponent: () => import('./paginas/main-layout/progreso/progreso').then(m => m.ProgresoComponent)},
            {path: 'completadas', loadComponent: () => import('./paginas/main-layout/completadas/completadas').then(m => m.CompletadasComponent)},
            {path: 'vencidas', loadComponent: () => import('./paginas/main-layout/vencidas/vencidas').then(m => m.VencidasComponent)},
            {path: 'lista/:id', loadComponent: () => import('./paginas/main-layout/detalles-lista/detalles-lista').then(m => m.DetalleListaComponent)},
            {path: 'notas', loadComponent: () => import('./paginas/notas/notas').then(m => m.Notas)},
            {path: 'operator', loadComponent: () => import('./componentes/operator-section/operator-section').then(m => m.AdminSectionsComponent)}
        ]
    },
    {path: 'compartida/:id', loadComponent: () => import('./paginas/lista-compartida/lista-compartida').then(m => m.ListaCompartida)},
    {path: '', redirectTo: 'landing', pathMatch: 'full'},
    {path: '**', redirectTo: 'landing'}
];