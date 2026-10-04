import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Message, SendMessageRequest } from '../../shared/models/message.model';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private api         = inject(ApiService);
  private authService = inject(AuthService);

  private stompClient: Client | null = null;

  newMessage  = signal<Message | null>(null);
  /** Total unread messages — drives the navbar badge */
  unreadCount = signal<number>(0);

  connect(): void {
    const token = this.authService.getToken();
    this.loadUnreadCount();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.stompClient!.subscribe(
          `/user/queue/messages`,
          (msg: IMessage) => {
            const message: Message = JSON.parse(msg.body);
            this.newMessage.set(message);
            this.unreadCount.update(n => n + 1);
          }
        );

        this.stompClient!.subscribe(
          `/user/queue/unread-count`,
          (msg: IMessage) => {
            const payload = JSON.parse(msg.body);
            this.unreadCount.set(payload.count ?? 0);
          }
        );
      },
      reconnectDelay: 5000,
    });
    this.stompClient.activate();
  }

  disconnect(): void {
    this.stompClient?.deactivate();
    this.unreadCount.set(0);
  }

  /**
   * Called when a specific conversation is opened.
   * Subtracts only that conversation's unread count from the navbar badge.
   */
  subtractUnread(count: number): void {
    this.unreadCount.update(n => Math.max(0, n - count));
  }

  loadUnreadCount(): void {
    if (!this.authService.isAuthenticated()) return;
    this.api.get<number>('/messages/unread-count').subscribe({
      next: count => this.unreadCount.set(count ?? 0),
      error: ()    => {}
    });
  }

  send(req: SendMessageRequest): Observable<Message> {
    return this.api.post<Message>('/messages', req);
  }

  getConversation(partnerId: number): Observable<Message[]> {
    return this.api.get<Message[]>(`/messages/conversation/${partnerId}`);
  }

  getPreviews(): Observable<Message[]> {
    return this.api.get<Message[]>('/messages/previews');
  }
}
