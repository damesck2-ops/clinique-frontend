import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Facture, FactureRequest, ModePaiement, StatutFacture } from '../models/facture.model';
import { PageResponse } from '../models/page.model';
import { TAILLE_PAGE } from '../../shared/pagination/paginer.pipe';

@Injectable({ providedIn: 'root' })
export class FactureService {
  private apiUrl = `${environment.apiUrl}/factures`;

  constructor(private http: HttpClient) {}

  page(page: number): Observable<PageResponse<Facture>> {
    return this.http.get<PageResponse<Facture>>(`${this.apiUrl}/page`, { params: new HttpParams().set('page', page - 1).set('size', TAILLE_PAGE) });
  }

  findAll(filtres?: { patientId?: number; statut?: StatutFacture }): Observable<Facture[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (filtres?.patientId) params.push(`patientId=${filtres.patientId}`);
    if (filtres?.statut) params.push(`statut=${filtres.statut}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<Facture[]>(url);
  }

  findById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`);
  }

  findHospitalisations(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/hospitalisations`);
  }

  creer(request: FactureRequest): Observable<Facture> {
    return this.http.post<Facture>(this.apiUrl, request);
  }

  payer(id: number, modePaiement: ModePaiement): Observable<Facture> {
    return this.http.patch<Facture>(`${this.apiUrl}/${id}/payer?modePaiement=${modePaiement}`, {});
  }

  annuler(id: number): Observable<Facture> {
    return this.http.patch<Facture>(`${this.apiUrl}/${id}/annuler`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
