import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BilanPeriode, ComptabiliteResume, Encaissement, PaiementEmploye, PeriodeBilan } from '../models/comptabilite.model';
import { Utilisateur } from '../models/user.model';
import { PageResponse } from '../models/page.model';
import { TAILLE_PAGE } from '../../shared/pagination/paginer.pipe';

@Injectable({ providedIn: 'root' })
export class ComptabiliteService {
  private apiUrl = `${environment.apiUrl}/comptabilite`;
  private usersUrl = `${environment.apiUrl}/utilisateurs`;
  constructor(private http: HttpClient) {}
  resume(): Observable<ComptabiliteResume> { return this.http.get<ComptabiliteResume>(`${this.apiUrl}/resume`); }
  bilan(periode: PeriodeBilan, annee: number): Observable<BilanPeriode[]> {
    return this.http.get<BilanPeriode[]>(`${this.apiUrl}/bilan?periode=${periode}&annee=${annee}`);
  }
  /** Export Excel de la période (dates au format AAAA-MM-JJ). */
  exporter(debut: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export?debut=${debut}&fin=${fin}`, { responseType: 'blob' });
  }
  encaissements(): Observable<Encaissement[]> { return this.http.get<Encaissement[]>(`${this.apiUrl}/encaissements`); }
  encaissementsPage(page: number): Observable<PageResponse<Encaissement>> {
    return this.http.get<PageResponse<Encaissement>>(`${this.apiUrl}/encaissements/page`, { params: new HttpParams().set('page', page - 1).set('size', TAILLE_PAGE) });
  }
  paiementsPage(page: number): Observable<PageResponse<PaiementEmploye>> {
    return this.http.get<PageResponse<PaiementEmploye>>(`${this.apiUrl}/paiements/page`, { params: new HttpParams().set('page', page - 1).set('size', TAILLE_PAGE) });
  }
  paiements(): Observable<PaiementEmploye[]> { return this.http.get<PaiementEmploye[]>(`${this.apiUrl}/paiements`); }
  employes(): Observable<Utilisateur[]> { return this.http.get<Utilisateur[]>(`${this.usersUrl}/employes`); }
  employesPage(page: number, size: number): Observable<{ content: Utilisateur[]; totalPages: number; totalElements: number }> {
    return this.http.get<{ content: Utilisateur[]; totalPages: number; totalElements: number }>(`${this.usersUrl}/employes/page?page=${page}&size=${size}`);
  }
  creerEmploye(employe: any): Observable<Utilisateur> { return this.http.post<Utilisateur>(this.usersUrl, employe); }
  modifierEmploye(id: number, employe: any): Observable<Utilisateur> { return this.http.put<Utilisateur>(`${this.usersUrl}/${id}`, employe); }
  supprimerEmploye(id: number): Observable<void> { return this.http.delete<void>(`${this.usersUrl}/${id}`); }
  payer(request: any): Observable<PaiementEmploye> { return this.http.post<PaiementEmploye>(`${this.apiUrl}/paiements`, request); }
}