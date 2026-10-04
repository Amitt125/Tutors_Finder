import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { TutorProfile, TutorDocument, TutorSearchRequest, Subject } from '../../shared/models/tutor.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TutorService {
  private api  = inject(ApiService);
  private http = inject(HttpClient);

  searchNearby(req: TutorSearchRequest): Observable<TutorProfile[]> {
    return this.api.get<TutorProfile[]>('/tutors/search', req);
  }

  getById(id: number): Observable<TutorProfile> {
    return this.api.get<TutorProfile>(`/tutors/${id}`);
  }

  getMyProfile(): Observable<TutorProfile> {
    return this.api.get<TutorProfile>('/tutors/me');
  }

  updateProfile(data: Partial<TutorProfile> & { subjectIds?: number[] }): Observable<TutorProfile> {
    return this.api.put<TutorProfile>('/tutors/me', data);
  }

  getSubjects(): Observable<Subject[]> {
    return this.api.get<Subject[]>('/subjects');
  }

  /**
   * Upload profile picture — multipart/form-data
   * Returns the saved URL string
   */
  uploadProfilePicture(file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ success: boolean; data: string }>(
      `${environment.apiUrl}/tutors/me/profile-picture`, fd
    ).pipe(map(r => r.data));
  }

  /**
   * Upload qualification certificate — multipart/form-data (optional)
   * Returns saved TutorDocument
   */
  uploadCertificate(file: File, certificateName: string, documentType: string): Observable<TutorDocument> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('certificateName', certificateName);
    fd.append('documentType', documentType);
    return this.http.post<{ success: boolean; data: TutorDocument }>(
      `${environment.apiUrl}/tutors/me/certificates`, fd
    ).pipe(map(r => r.data));
  }

  deleteCertificate(docId: number): Observable<void> {
    return this.api.delete<void>(`/tutors/me/certificates/${docId}`);
  }
}
