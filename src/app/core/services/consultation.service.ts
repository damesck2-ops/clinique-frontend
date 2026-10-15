import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Consultation, ConsultationRequest } from '../models/consultation.model';
import { PageResponse } from '../models/page.model';
import { TAILLE_PAGE } from '../../shared/pagination/paginer.pipe';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(this.apiUrl);
  }

  page(page: number): Observable<PageResponse<Consultation>> {
    return this.http.get<PageResponse<Consultation>>(`${this.apiUrl}/page`, { params: new HttpParams().set('page', page - 1).set('size', TAILLE_PAGE) });
  }

  findByPatient(patientId: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  findById(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  creer(request: ConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, request);
  }
}
