import { Component, OnInit, ViewChild, ElementRef, inject, effect, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DatePipe, SlicePipe } from '@angular/common';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { Message } from '../../shared/models/message.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, MatInputModule, DatePipe, SlicePipe],
  template: `
    <div class="chat-layout">
      <aside class="conversations-panel">
        <div class="panel-header"><h3>Messages</h3></div>
        <div class="conversations-list">
          @for (msg of previews(); track msg.id) {

            <!-- ── FIX 2: always show the PARTNER name, not the sender name ── -->
            @let partnerId   = msg.senderId === myId ? msg.receiverId : msg.senderId;
            @let partnerName = msg.senderId === myId ? (msg.receiverName ?? '') : msg.senderName;

            <div class="conv-item"
                 [class.active]="activePartnerId() === partnerId"
                 (click)="open(partnerId, partnerName)">
              <div class="conv-avatar">{{ initials(partnerName) }}</div>
              <div class="conv-info">
                <div class="conv-name-row">
                  <strong>{{ partnerName }}</strong>
                  @if ((msg.unreadCount ?? 0) > 0) {
                    <span class="conv-badge">
                      {{ (msg.unreadCount ?? 0) > 99 ? '99+' : msg.unreadCount }}
                    </span>
                  }
                </div>
                <span [class.unread-preview]="(msg.unreadCount ?? 0) > 0">
                  {{ msg.content | slice:0:40 }}
                </span>
              </div>
              <span class="conv-time">{{ msg.createdAt | date:'shortTime' }}</span>
            </div>
          } @empty {
            <p style="padding:20px;text-align:center;color:#94a3b8;font-size:14px">No conversations yet</p>
          }
        </div>
      </aside>

      <div class="chat-window">
        @if (activePartnerId()) {
          <div class="chat-header">
            <div class="chat-avatar">{{ initials(activePartnerName()) }}</div>
            <strong>{{ activePartnerName() }}</strong>
          </div>

          <div class="messages-area" #messagesArea>
            @for (msg of messages(); track msg.id) {
              <div class="message" [class.sent]="msg.senderId === myId" [class.received]="msg.senderId !== myId">
                <div class="bubble">{{ msg.content }}</div>
                <span class="time">{{ msg.createdAt | date:'shortTime' }}</span>
              </div>
            }
          </div>

          <div class="message-input">
            <input [formControl]="msgCtrl" placeholder="Type a message…" (keyup.enter)="send()">
            <button mat-icon-button (click)="send()" [disabled]="!msgCtrl.value?.trim()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        } @else {
          <div class="no-chat">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>Select a conversation to start chatting</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chat-layout { display:grid;grid-template-columns:300px 1fr;height:calc(100vh - 64px); }
    .conversations-panel { border-right:1px solid #e2e8f0;display:flex;flex-direction:column; }
    .panel-header { padding:16px 20px;border-bottom:1px solid #e2e8f0; }
    .panel-header h3 { font-size:18px;font-weight:700; }
    .conversations-list { flex:1;overflow-y:auto; }
    .conv-item { display:flex;align-items:center;gap:12px;padding:16px 20px;cursor:pointer;transition:background .15s; }
    .conv-item:hover { background:#f8fafc; }
    .conv-item.active { background:#eef2ff !important;border-right:3px solid #4f46e5; }
    .conv-item.active .conv-name-row strong { color:#4f46e5; }
    .conv-avatar { width:44px;height:44px;min-width:44px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600; }
    .conv-info { flex:1;overflow:hidden; }
    .conv-name-row { display:flex;align-items:center;gap:8px;margin-bottom:2px; }
    .conv-name-row strong { font-weight:600;font-size:14px; }
    .conv-info span { font-size:13px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block; }
    .unread-preview { color:#1e293b !important;font-weight:600 !important; }
    .conv-time { font-size:12px;color:#94a3b8;flex-shrink:0; }
    .conv-badge {
      background:#ef4444;color:white;
      font-size:10px;font-weight:700;line-height:1;
      min-width:18px;height:18px;border-radius:9px;
      display:inline-flex;align-items:center;justify-content:center;
      padding:0 5px;flex-shrink:0;
    }
    .chat-window { display:flex;flex-direction:column;min-height:0;overflow:hidden; }
    .chat-header { display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #e2e8f0;background:white;flex-shrink:0; }
    .chat-avatar { width:40px;height:40px;border-radius:50%;background:#4f46e5;color:white;display:flex;align-items:center;justify-content:center;font-weight:600; }
    .messages-area { flex:1;min-height:0;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:8px;background:#f8fafc; }
    .message { display:flex;flex-direction:column;max-width:70%; }
    .message.sent { align-self:flex-end;align-items:flex-end; }
    .message.received { align-self:flex-start; }
    .bubble { padding:12px 16px;border-radius:18px;font-size:14px;line-height:1.5; }
    .message.sent .bubble { background:#4f46e5;color:white;border-bottom-right-radius:4px; }
    .message.received .bubble { background:white;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgb(0 0 0 / 0.05); }
    .time { font-size:11px;color:#94a3b8;margin-top:4px;padding:0 4px; }
    .message-input { display:flex;align-items:center;padding:16px 20px;background:white;border-top:1px solid #e2e8f0;gap:8px;flex-shrink:0; }
    .message-input input { flex:1;border:1.5px solid #e2e8f0;border-radius:24px;padding:10px 16px;outline:none;font-size:14px; }
    .message-input input:focus { border-color:#4f46e5; }
    .message-input button { color:#4f46e5 !important; }
    .date-separator { display:flex;align-items:center;gap:10px;margin:12px 0;color:#94a3b8;font-size:12px;font-weight:500; }
    .date-separator::before, .date-separator::after { content:'';flex:1;height:1px;background:#e2e8f0; }
    .date-separator span { white-space:nowrap;background:#f8fafc;padding:2px 10px;border-radius:100px;border:1px solid #e2e8f0; }
    .no-chat { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#94a3b8; }
    .no-chat mat-icon { font-size:64px;width:64px;height:64px; }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesArea') messagesArea!: ElementRef;

  private msgService  = inject(MessageService);
  private authService = inject(AuthService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);

  messages          = signal<Message[]>([]);
  previews          = signal<Message[]>([]);
  activePartnerId   = signal<number | null>(null);
  activePartnerName = signal('');
  msgCtrl           = new FormControl('');
  myId!: number;

  constructor() {
    effect(() => {
      const newMsg = this.msgService.newMessage();
      if (!newMsg) return;

      // ── FIX 1: append message in real time without page refresh ──────────
      // newMsg.senderId is the person who sent it
      // newMsg.receiverId is the current user (me)
      // If the sender is the person I'm currently chatting with → append directly
      if (newMsg.senderId === this.activePartnerId()) {
        this.messages.update(msgs => [...msgs, newMsg]);
        this.scrollToBottom();
        // Also update the unread badge — since chat is open, don't increment
        this.msgService.subtractUnread(0); // no-op but keeps badge correct
      }

      // Always reload previews so sidebar and unread counts stay accurate
      this.loadPreviews();
    });
  }

  ngOnInit() {
    this.myId = this.authService.currentUser()!.id;
    this.loadPreviews();

    // ── FIX 3: resolve partner name from route param using previews ─────────
    this.route.params.subscribe(p => {
      if (p['partnerId']) {
        const id = +p['partnerId'];
        // Try to find name from already-loaded previews
        const name = this.resolvePartnerName(id);
        this.open(id, name);
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  /**
   * FIX 3: Resolve partner name from previews list.
   * The preview has both senderId/senderName and receiverId/receiverName.
   * We find the message involving this partnerId and return the other person's name.
   */
  private resolvePartnerName(partnerId: number): string {
    const preview = this.previews().find(m =>
      m.senderId === partnerId || m.receiverId === partnerId
    );
    if (!preview) return '';
    // Return the name of the partner (not mine)
    return preview.senderId === this.myId ? (preview.receiverName ?? '') : preview.senderName;
  }

  loadPreviews() {
    this.msgService.getPreviews().subscribe(p => {
      this.previews.set(p);
      // FIX 3: if we have an active partner but no name yet, resolve it now
      const id = this.activePartnerId();
      if (id && !this.activePartnerName()) {
        const name = this.resolvePartnerName(id);
        if (name) this.activePartnerName.set(name);
      }
    });
  }

  open(partnerId: number, name: string) {
    this.activePartnerId.set(partnerId);

    // FIX 3: if name is empty (came from route param), resolve from previews
    const resolvedName = name || this.resolvePartnerName(partnerId);
    this.activePartnerName.set(resolvedName);

    const preview   = this.previews().find(m =>
      m.senderId === partnerId || m.receiverId === partnerId
    );
    const hadUnread = preview?.unreadCount ?? 0;

    this.msgService.getConversation(partnerId).subscribe(msgs => {
      this.messages.set(msgs);
      this.scrollToBottom();

      // FIX 3: resolve name from conversation messages if still empty
      if (!this.activePartnerName()) {
        const fromMsg = msgs.find(m => m.senderId === partnerId);
        if (fromMsg) this.activePartnerName.set(fromMsg.senderName);
      }

      if (hadUnread > 0) this.msgService.subtractUnread(hadUnread);
      this.loadPreviews();
    });
    this.router.navigate(['/messages', partnerId], { replaceUrl: true });
  }

  send() {
    const content = this.msgCtrl.value?.trim();
    if (!content || !this.activePartnerId()) return;
    this.msgService.send({ receiverId: this.activePartnerId()!, content }).subscribe(msg => {
      this.messages.update(msgs => [...msgs, msg]);
      this.msgCtrl.reset();
      this.loadPreviews();
      this.scrollToBottom();
    });
  }

  isSameDay(a: string, b: string): boolean {
    return new Date(a).toDateString() === new Date(b).toDateString();
  }

  initials(name: string) {
    return (name ?? '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
