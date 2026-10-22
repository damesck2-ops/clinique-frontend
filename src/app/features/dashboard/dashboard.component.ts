import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { Notification } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';
import { interval, Subscription } from 'rxjs';
import { BarChartComponent, SerieGraphique } from '../../shared/bar-chart/bar-chart.component';
import { ComptabiliteService } from '../../core/services/comptabilite.service';
import { TraduirePipe } from '../../core/i18n/traduire.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BarChartComponent, TraduirePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between gap-2 mb-4">
      <h3 class="mb-0">{{ 'dash.bonjour' | t }}, {{ auth.currentUser()?.prenom }} 👋</h3>

      <div class="alertes-wrapper" *ngIf="auth.hasRole('ADMIN','MEDECIN')">
        <button type="button" class="btn btn-light alertes-toggle" [class.has-alertes]="alertes.length > 0"
                (click)="alertesOuvertes = !alertesOuvertes" [title]="'dash.nouvellesDemandes' | t">
          <i class="bi" [class.bi-bell-fill]="alertes.length > 0" [class.bi-bell]="alertes.length === 0"></i>
          <span class="badge rounded-pill bg-danger" *ngIf="alertes.length > 0">{{ alertes.length }}</span>
        </button>
        <div class="alertes-panel shadow" *ngIf="alertesOuvertes">
          <div class="alertes-panel-header">
            <strong>{{ 'dash.nouvellesDemandes' | t }}</strong>
            <span class="badge bg-danger" *ngIf="alertes.length > 0">{{ alertes.length }}</span>
          </div>
          <button type="button" class="dashboard-alert" *ngFor="let alerte of alertes" (click)="ouvrirAlerte(alerte)">
            <i class="bi" [class.bi-journal-medical]="alerte.type === 'PATIENT_CONSULTATION'" [class.bi-calendar-check]="alerte.type === 'PATIENT_RENDEZVOUS'"></i>
            <span>{{ alerte.message }} <small>{{ alerte.dateCreation | date:'dd/MM/yyyy HH:mm' }}</small></span>
          </button>
          <div class="text-muted small p-2" *ngIf="alertes.length === 0">{{ 'dash.aucuneDemande' | t }}</div>
        </div>
      </div>
    </div>

    <div class="row g-3" *ngIf="stats">
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-people fs-2 text-primary"></i>
          <h4 class="mt-2 mb-0">{{ stats.totalPatients }}</h4>
          <small class="text-muted">{{ 'dash.patients' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-calendar-day fs-2 text-info"></i>
          <h4 class="mt-2 mb-0">{{ stats.rendezVousAujourdhui }}</h4>
          <small class="text-muted">{{ 'dash.rdvAujourdhui' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-calendar-check fs-2 text-secondary"></i>
          <h4 class="mt-2 mb-0">{{ stats.rendezVousPlanifies }}</h4>
          <small class="text-muted">{{ 'dash.rdvPlanifies' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-receipt fs-2 text-warning"></i>
          <h4 class="mt-2 mb-0">{{ stats.facturesEnAttente }}</h4>
          <small class="text-muted">{{ 'dash.facturesAttente' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-exclamation-triangle fs-2 text-danger"></i>
          <h4 class="mt-2 mb-0">{{ stats.medicamentsEnAlerte }}</h4>
          <small class="text-muted">{{ 'dash.stocksAlerte' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-4 col-lg-2">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-cash-coin fs-2 text-success"></i>
          <h4 class="mt-2 mb-0">{{ stats.chiffreAffaires | number:'1.0-0' }}</h4>
          <small class="text-muted">{{ 'dash.ca' | t }}</small>
        </div>
      </div>
    </div>

    <div class="row g-3 mt-1" *ngIf="stats && auth.hasRole('ADMIN')">
      <div class="col-6 col-md-6 col-lg-3">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-wallet2 fs-2 text-success"></i>
          <h4 class="mt-2 mb-0">{{ stats.encaissementsAujourdhui | number:'1.0-0' }}</h4>
          <small class="text-muted">{{ 'dash.encaisseJour' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-journal-medical fs-2 text-primary"></i>
          <h4 class="mt-2 mb-0">{{ stats.encaissementsConsultations | number:'1.0-0' }}</h4>
          <small class="text-muted">{{ 'dash.consultationsEncaissees' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3">
        <div class="card card-stat p-3 text-center h-100">
          <i class="bi bi-calendar-check fs-2 text-info"></i>
          <h4 class="mt-2 mb-0">{{ stats.encaissementsRendezVous | number:'1.0-0' }}</h4>
          <small class="text-muted">{{ 'dash.rdvEncaisses' | t }}</small>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3">
        <a routerLink="/organismes" class="card card-stat p-3 text-center text-decoration-none h-100">
          <i class="bi bi-building fs-2 text-secondary"></i>
          <h4 class="mt-2 mb-0">{{ stats.priseEnChargeOrganismes | number:'1.0-0' }}</h4>
          <small class="text-muted">{{ 'dash.priseEnCharge' | t }}</small>
        </a>
      </div>
    </div>

    <div class="card p-3 mt-3" *ngIf="auth.hasRole('ADMIN') && libellesBilan.length">
      <app-bar-chart [titre]="('dash.recettesMois' | t) + ' — ' + anneeCourante" [sousTitre]="'dash.recettesSousTitre' | t"
                     [empile]="true" [libelles]="libellesBilan" [series]="seriesRecettesTraduites" />
      <div class="text-end mt-2"><a routerLink="/comptabilite" class="small">{{ 'dash.voirBilans' | t }} <i class="bi bi-arrow-right"></i></a></div>
    </div>

    <div class="row mt-4 g-3">
      <div class="col-6 col-md-3">
        <a routerLink="/patients/nouveau" class="btn btn-outline-primary w-100 h-100 py-3">
          <i class="bi bi-person-plus fs-4 d-block mb-1"></i> {{ 'dash.nouveauPatient' | t }}
        </a>
      </div>
      <div class="col-6 col-md-3">
        <a routerLink="/rendezvous/nouveau" class="btn btn-outline-primary w-100 h-100 py-3">
          <i class="bi bi-calendar-plus fs-4 d-block mb-1"></i> {{ 'dash.nouveauRdv' | t }}
        </a>
      </div>
      <div class="col-6 col-md-3">
        <a routerLink="/factures/nouvelle" class="btn btn-outline-primary w-100 h-100 py-3">
          <i class="bi bi-file-earmark-plus fs-4 d-block mb-1"></i> {{ 'dash.nouvelleFacture' | t }}
        </a>
      </div>
      <div class="col-6 col-md-3" *ngIf="auth.hasRole('ADMIN','PHARMACIEN')">
        <a routerLink="/pharmacie" class="btn btn-outline-primary w-100 h-100 py-3">
          <i class="bi bi-capsule fs-4 d-block mb-1"></i> {{ 'dash.pharmacie' | t }}
        </a>
      </div>
    </div>
  `
  ,
  styles: [`
    .alertes-wrapper { position: relative; flex-shrink: 0; }
    .alertes-toggle { position: relative; font-size: 1.35rem; line-height: 1; padding: .45rem .6rem; border-radius: 50%; }
    .alertes-toggle.has-alertes i { color: #dc3545; }
    .alertes-toggle .badge { position: absolute; top: -2px; right: -4px; font-size: .65rem; }
    .alertes-panel { position: absolute; right: 0; top: calc(100% + .4rem); z-index: 1050; width: min(360px, calc(100vw - 32px)); max-height: 60vh; overflow-y: auto; padding: .5rem; border-radius: 8px; background: var(--bs-body-bg, #fff); border: 1px solid rgba(0, 0, 0, .1); }
    .alertes-panel-header { display: flex; align-items: center; gap: .5rem; padding: .25rem .4rem .4rem; }
    .dashboard-alert { display: flex; align-items: center; gap: .65rem; width: 100%; margin-top: .35rem; padding: .55rem .7rem; border: 0; border-radius: 6px; color: #664d03; background: #fff8e1; text-align: left; }
    .dashboard-alert:hover { background: #ffecb3; }
    .dashboard-alert i { color: #9a7400; }
    .dashboard-alert small { display: block; color: #806d35; }
    /* Smartphone : tuiles compactes sur deux colonnes, comme l'écran d'accueil d'une application. */
    @media (max-width: 575.98px) {
      .card-stat { padding: .85rem .6rem !important; }
      .card-stat .fs-2 { font-size: 1.45rem !important; }
      .card-stat h4 { font-size: 1.15rem; }
      .card-stat small { display: block; font-size: .72rem; line-height: 1.25; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  alertes: Notification[] = [];
  alertesOuvertes = false;
  anneeCourante = new Date().getFullYear();
  libellesBilan: string[] = [];
  seriesRecettes: SerieGraphique[] = [];
  private notificationsSubscription?: Subscription;

  constructor(private dashboardService: DashboardService, public auth: AuthService,
              private notificationService: NotificationService, private router: Router,
              private comptabiliteService: ComptabiliteService, private i18n: I18nService) {}

  /** Noms de séries dans la langue courante (les couleurs restent attachées à l'entité). */
  get seriesRecettesTraduites(): SerieGraphique[] {
    const langue = this.i18n.langue();
    if (this.cacheSeries.source !== this.seriesRecettes || this.cacheSeries.langue !== langue) {
      const cles = ['dash.payePatients', 'dash.assurancesIpm', 'dash.factures'];
      this.cacheSeries = { source: this.seriesRecettes, langue,
        valeur: this.seriesRecettes.map((s, i) => ({ ...s, nom: this.i18n.t(cles[i]) })) };
    }
    return this.cacheSeries.valeur;
  }
  private cacheSeries: { source: SerieGraphique[] | null; langue: string; valeur: SerieGraphique[] } = { source: null, langue: '', valeur: [] };

  ngOnInit(): void {
    this.dashboardService.stats().subscribe((s) => (this.stats = s));
    if (this.auth.hasRole('ADMIN')) {
      this.comptabiliteService.bilan('MOIS', this.anneeCourante).subscribe((b) => {
        this.libellesBilan = b.map((x) => x.libelle);
        this.seriesRecettes = [
          { nom: 'Payé par les patients', couleur: '#2a78d6', valeurs: b.map((x) => x.recettesPatients) },
          { nom: 'Assurances / IPM', couleur: '#eb6834', valeurs: b.map((x) => x.recettesOrganismes) },
          { nom: 'Factures', couleur: '#1baf7a', valeurs: b.map((x) => x.recettesFactures) }];
      });
    }
    if (this.auth.hasRole('ADMIN', 'MEDECIN')) {
      this.chargerAlertes();
      this.notificationsSubscription = interval(60000).subscribe(() => this.chargerAlertes());
    }
  }

  ngOnDestroy(): void {
    this.notificationsSubscription?.unsubscribe();
  }

  chargerAlertes(): void {
    this.notificationService.findAll().subscribe((notifications) => {
      this.alertes = notifications.filter((notification) =>
        !notification.lue && (notification.type === 'PATIENT_CONSULTATION' || notification.type === 'PATIENT_RENDEZVOUS'));
    });
  }

  ouvrirAlerte(alerte: Notification): void {
    this.alertesOuvertes = false;
    this.notificationService.marquerLue(alerte.id).subscribe(() => this.chargerAlertes());
    if (alerte.type === 'PATIENT_CONSULTATION') {
      this.router.navigate(['/consultations/nouvelle', alerte.patientId]);
    } else {
      this.router.navigate(['/rendezvous'], { queryParams: { focusId: alerte.rendezVousId } });
    }
  }
}
