import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Facture, StatutFacture } from '../../../core/models/facture.model';
import { FactureService } from '../../../core/services/facture.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-facture-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginationComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4><i class="bi bi-receipt"></i> Factures</h4>
      <a routerLink="/factures/nouvelle" class="btn btn-primary">
        <i class="bi bi-plus-lg"></i> Nouvelle facture
      </a>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>N° Facture</th>
              <th>Date</th>
              <th>Patient</th>
              <th class="text-end">Montant (FCFA)</th>
              <th>Statut</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f of factures">
              <td>{{ f.numeroFacture }}</td>
              <td>{{ f.dateFacture | date:'dd/MM/yyyy' }}</td>
              <td>{{ f.patient?.prenom }} {{ f.patient?.nom }}</td>
              <td class="text-end">{{ f.montantTotal | number:'1.0-0' }}</td>
              <td>
                <span class="badge" [ngClass]="badgeClasse(f.statut)">{{ traduireStatut(f.statut) }}</span>
              </td>
              <td class="text-end">
                <a [routerLink]="['/factures', f.id]" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-eye"></i> Voir
                </a>
              </td>
            </tr>
            <tr *ngIf="factures.length === 0">
              <td colspan="6" class="text-center text-muted py-4">Aucune facture</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <app-pagination [page]="page" [totalPages]="totalPages" (pageChange)="charger($event)"></app-pagination>
  `
})
export class FactureListComponent implements OnInit {
  factures: Facture[] = [];
  page = 1;
  totalPages = 1;

  constructor(private factureService: FactureService) {}

  ngOnInit(): void {
    this.charger(1);
  }

  charger(page: number): void {
    this.factureService.page(page).subscribe((p) => {
      this.factures = p.content;
      this.totalPages = Math.max(1, p.totalPages);
      this.page = page;
    });
  }

  traduireStatut(statut?: StatutFacture): string {
    const map: Record<string, string> = { EN_ATTENTE: 'En attente', PAYEE: 'Payée', ANNULEE: 'Annulée' };
    return statut ? map[statut] : '-';
  }

  badgeClasse(statut?: StatutFacture): string {
    const map: Record<string, string> = { EN_ATTENTE: 'bg-warning text-dark', PAYEE: 'bg-success', ANNULEE: 'bg-danger' };
    return statut ? map[statut] : 'bg-secondary';
  }
}
