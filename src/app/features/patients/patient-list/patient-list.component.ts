import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../../core/models/patient.model';
import { PatientImportResult, PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4><i class="bi bi-people"></i> Patients</h4>
      <div class="d-flex gap-2" *ngIf="auth.hasRole('ADMIN','RECEPTIONNISTE','MEDECIN','INFIRMIER')">
        <input #fichierInput type="file" class="d-none" accept=".xlsx,.xls,.docx"
               (change)="importer($event)">
        <button type="button" class="btn btn-outline-primary" (click)="fichierInput.click()" [disabled]="importEnCours">
          <i class="bi bi-upload"></i> {{ importEnCours ? 'Import...' : 'Importer' }}
        </button>
        <a routerLink="/patients/nouveau" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> Nouveau patient
        </a>
      </div>
    </div>

    <div class="alert alert-success" *ngIf="importResult">
      Import termine : {{ importResult.importes }} patient(s) ajoute(s), {{ importResult.ignores }} doublon(s) ignore(s).
      <ul class="mb-0 mt-2" *ngIf="importResult.erreurs.length">
        <li *ngFor="let erreur of importResult.erreurs">{{ erreur }}</li>
      </ul>
    </div>
    <div class="alert alert-danger" *ngIf="importErreur">{{ importErreur }}</div>

    <div class="input-group mb-3" style="max-width: 400px;">
      <span class="input-group-text"><i class="bi bi-search"></i></span>
      <input type="text" class="form-control" placeholder="Rechercher un patient..."
             [(ngModel)]="recherche" (ngModelChange)="rechercher()">
    </div>

    <div class="alert alert-danger" *ngIf="erreurSuppression">{{ erreurSuppression }}</div>
    <div class="alert alert-success" *ngIf="messageSuppression">{{ messageSuppression }}</div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Téléphone</th>
              <th>Sexe</th>
              <th>Groupe sanguin</th>
              <th>Assureur / IPM</th>
              <th>Créé le</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of patients">
              <td>{{ p.numeroDossier }}</td>
              <td>{{ p.nom }}</td>
              <td>{{ p.prenom }}</td>
              <td>{{ p.telephone || '-' }}</td>
              <td>{{ p.sexe || '-' }}</td>
              <td>{{ p.groupeSanguin || '-' }}</td>
              <td>{{ p.organisme?.nom || 'Comptant' }}</td>
              <td class="text-nowrap">{{ p.dateCreation ? (p.dateCreation | date:'dd/MM/yyyy') : '-' }}</td>
              <td class="text-end text-nowrap">
                <a [routerLink]="['/patients', p.id]" class="btn btn-sm btn-outline-primary me-1" title="Dossier">
                  <i class="bi bi-eye"></i>
                </a>
                <a [routerLink]="['/patients', p.id, 'modifier']" class="btn btn-sm btn-outline-secondary" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </a>
                <button type="button" *ngIf="auth.hasRole('ADMIN')" class="btn btn-sm btn-outline-danger ms-1"
                        title="Supprimer" (click)="supprimer(p)">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="patients.length === 0">
              <td colspan="9" class="text-center text-muted py-4">Aucun patient trouvé</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="charger($event)"></app-pagination>
  `
})
export class PatientListComponent implements OnInit, OnDestroy {
  patients: Patient[] = [];
  recherche = '';
  importEnCours = false;
  importResult?: PatientImportResult;
  importErreur = '';
  page = 1;
  totalPages = 1;
  private recherche$ = new Subject<string>();
  private rechercheSub?: Subscription;

  erreurSuppression = '';
  messageSuppression = '';

  constructor(private patientService: PatientService, public auth: AuthService) {}

  supprimer(p: Patient): void {
    if (!confirm(`Supprimer définitivement ${p.prenom} ${p.nom} (${p.numeroDossier}) ?\n`
      + 'Ses consultations, rendez-vous et factures non payées seront aussi supprimés.')) return;
    this.erreurSuppression = '';
    this.messageSuppression = '';
    this.patientService.delete(p.id!).subscribe({
      next: () => {
        // Revient à la page précédente si on vient de vider la dernière
        this.charger(this.patients.length === 1 && this.page > 1 ? this.page - 1 : this.page);
        this.messageSuppression = `${p.prenom} ${p.nom} a été supprimé.`;
      },
      error: (err) => (this.erreurSuppression = err.error?.message || 'La suppression a échoué.')
    });
  }

  ngOnInit(): void {
    // Attend une pause dans la frappe avant d'interroger l'API
    this.rechercheSub = this.recherche$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.charger(1));
    this.charger(1);
  }

  ngOnDestroy(): void {
    this.rechercheSub?.unsubscribe();
  }

  charger(page = this.page): void {
    this.patientService.page(page, this.recherche.trim()).subscribe((p) => {
      this.patients = p.content;
      this.totalPages = Math.max(1, p.totalPages);
      this.page = page;
    });
  }

  rechercher(): void {
    this.recherche$.next(this.recherche.trim());
  }

  importer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';
    if (!fichier) return;

    this.importEnCours = true;
    this.importResult = undefined;
    this.importErreur = '';
    this.patientService.importer(fichier).subscribe({
      next: (resultat) => {
        this.importResult = resultat;
        this.importEnCours = false;
        this.charger(1);
      },
      error: (erreur) => {
        this.importErreur = erreur.error?.message || 'L import du fichier a echoue.';
        this.importEnCours = false;
      }
    });
  }
}
