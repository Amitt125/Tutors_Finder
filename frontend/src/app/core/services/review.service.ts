import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Review, ReviewRequest } from '../../shared/models/booking.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = inject(ApiService);

  submit(req: ReviewRequest): Observable<Review> {
    return this.api.post<Review>('/reviews', req);
  }

  getByTutor(tutorUserId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`/reviews/tutor/${tutorUserId}`);
  }

  hasReviewed(bookingId: number): Observable<boolean> {
    return this.api.get<boolean>(`/reviews/check/${bookingId}`);
  }

  addReply(reviewId: number, reply: string): Observable<Review> {
    return this.api.patch<Review>(`/reviews/${reviewId}/reply`, { reply });
  }
}
