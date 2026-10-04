import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  getStats():     Observable<any>   { return this.api.get('/admin/stats'); }
  getUsers():     Observable<any[]> { return this.api.get('/admin/users'); }
  getDocuments(): Observable<any[]> { return this.api.get('/admin/documents'); }
  getBookings():  Observable<any[]> { return this.api.get('/admin/bookings'); }
  getPayments():  Observable<any[]> { return this.api.get('/admin/payments'); }

  activateUser(id: number):   Observable<any> { return this.api.patch(`/admin/users/${id}/activate`); }
  deactivateUser(id: number): Observable<any> { return this.api.patch(`/admin/users/${id}/deactivate`); }
  verifyDoc(id: number):      Observable<any> { return this.api.patch(`/admin/documents/${id}/verify`); }
  rejectDoc(id: number):      Observable<any> { return this.api.patch(`/admin/documents/${id}/reject`); }

  getReviews():               Observable<any[]> { return this.api.get('/admin/reviews'); }
  deleteReview(id: number):   Observable<any>   { return this.api.delete(`/admin/reviews/${id}`); }

  getChats():                              Observable<any[]> { return this.api.get('/admin/chats'); }
  getChatMessages(aId: number, bId: number): Observable<any[]> { return this.api.get(`/admin/chats/${aId}/${bId}`); }
}
