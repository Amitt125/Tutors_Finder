import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-chats',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Chat Monitor</h1>
      <p class="sub">View all conversations between users</p>
    </div>

    <div class="chat-monitor-layout">
      <!-- Left: Conversation list -->
      <div class="convo-list card">
        <div class="convo-list-header">
          <input class="search-input" [(ngModel)]="search"
                 placeholder="Search users…"
                 (ngModelChange)="filterConvos()">
        </div>
        @if (loadingConvos()) {
          <div style="text-align:center;padding:40px">
            <mat-spinner diameter="36" style="margin:0 auto" />
          </div>
        } @else if (filteredConvos().length === 0) {
          <div class="empty-convos">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>No conversations found</p>
          </div>
        } @else {
          @for (c of filteredConvos(); track c.userAId + '-' + c.userBId) {
            <div class="convo-item"
                 [class.active]="selectedConvo() === c"
                 (click)="openConvo(c)">
              <div class="convo-avatars">
                <div class="avatar a1">{{ initials(c.userAName) }}</div>
                <div class="avatar a2">{{ initials(c.userBName) }}</div>
              </div>
              <div class="convo-info">
                <strong>{{ c.userAName }} & {{ c.userBName }}</strong>
                <span class="last-msg">{{ c.lastMessage | slice:0:45 }}{{ c.lastMessage?.length > 45 ? '…' : '' }}</span>
              </div>
              <span class="convo-time">{{ c.lastTime | date:'dd MMM' }}</span>
            </div>
          }
        }
      </div>

      <!-- Right: Messages view -->
      <div class="messages-panel card">
        @if (!selectedConvo()) {
          <div class="no-selection">
            <mat-icon>forum</mat-icon>
            <p>Select a conversation to view messages</p>
          </div>
        } @else {
          <div class="messages-header">
            <div class="header-avatars">
              <div class="avatar a1">{{ initials(selectedConvo()!.userAName) }}</div>
              <div class="avatar a2">{{ initials(selectedConvo()!.userBName) }}</div>
            </div>
            <div>
              <strong>{{ selectedConvo()!.userAName }} & {{ selectedConvo()!.userBName }}</strong>
              <span class="msg-count">{{ messages().length }} messages</span>
            </div>
          </div>

          @if (loadingMsgs()) {
            <div style="text-align:center;padding:40px">
              <mat-spinner diameter="36" style="margin:0 auto" />
            </div>
          } @else {
            <div class="messages-area">
              @for (msg of messages(); track msg.id; let i = $index) {
                <!-- Date separator -->
                @if (i === 0 || !isSameDay(messages()[i-1].createdAt, msg.createdAt)) {
                  <div class="date-sep">
                    <span>{{ msg.createdAt | date:'dd MMM yyyy' }}</span>
                  </div>
                }
                <div class="msg-row"
                     [class.msg-a]="msg.senderId === selectedConvo()!.userAId"
                     [class.msg-b]="msg.senderId === selectedConvo()!.userBId">
                  <div class="msg-meta">
                    <span class="msg-sender">{{ msg.senderName }}</span>
                    <span class="msg-time">{{ msg.createdAt | date:'shortTime' }}</span>
                  </div>
                  <div class="msg-bubble">{{ msg.content }}</div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom:20px; }
    .page-title { font-size:26px;font-weight:800;color:#1e293b;margin-bottom:4px; }
    .sub { color:#64748b;font-size:14px; }
    .chat-monitor-layout { display:grid;grid-template-columns:340px 1fr;gap:20px;height:calc(100vh - 180px); }
    /* Convo list */
    .convo-list { display:flex;flex-direction:column;overflow:hidden;padding:0 !important; }
    .convo-list-header { padding:16px;border-bottom:1px solid #e2e8f0;flex-shrink:0; }
    .search-input { width:100%;padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box; }
    .search-input:focus { border-color:#4f46e5; }
    .empty-convos { display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px;color:#94a3b8; }
    .empty-convos mat-icon { font-size:40px;width:40px;height:40px; }
    .convo-item { display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .15s; }
    .convo-item:hover { background:#f8fafc; }
    .convo-item.active { background:#eef2ff;border-right:3px solid #4f46e5; }
    .convo-avatars { position:relative;width:48px;height:36px;flex-shrink:0; }
    .avatar { width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;border:2px solid white; }
    .a1 { background:#4f46e5;position:absolute;top:0;left:0; }
    .a2 { background:#059669;position:absolute;bottom:0;right:0; }
    .convo-info { flex:1;min-width:0; }
    .convo-info strong { display:block;font-size:13px;font-weight:600;margin-bottom:2px; }
    .last-msg { font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block; }
    .convo-time { font-size:11px;color:#94a3b8;flex-shrink:0; }
    /* Messages panel */
    .messages-panel { display:flex;flex-direction:column;overflow:hidden;padding:0 !important; }
    .no-selection { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#94a3b8; }
    .no-selection mat-icon { font-size:56px;width:56px;height:56px; }
    .messages-header { display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #e2e8f0;flex-shrink:0; }
    .header-avatars { position:relative;width:52px;height:40px;flex-shrink:0; }
    .messages-header strong { display:block;font-size:15px;font-weight:700; }
    .msg-count { font-size:12px;color:#94a3b8; }
    .messages-area { flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;background:#f8fafc; }
    /* Date separator */
    .date-sep { display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:11px;font-weight:500;margin:8px 0; }
    .date-sep::before,.date-sep::after { content:'';flex:1;height:1px;background:#e2e8f0; }
    .date-sep span { white-space:nowrap;background:#f8fafc;padding:2px 10px;border-radius:100px;border:1px solid #e2e8f0; }
    /* Message rows */
    .msg-row { display:flex;flex-direction:column;max-width:70%; }
    .msg-a { align-self:flex-start; }
    .msg-b { align-self:flex-end;align-items:flex-end; }
    .msg-meta { display:flex;gap:8px;align-items:center;margin-bottom:3px; }
    .msg-sender { font-size:11px;font-weight:600;color:#64748b; }
    .msg-time { font-size:11px;color:#94a3b8; }
    .msg-bubble { padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5; }
    .msg-a .msg-bubble { background:white;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgb(0 0 0/.06); }
    .msg-b .msg-bubble { background:#4f46e5;color:white;border-bottom-right-radius:4px; }
    @media(max-width:768px) { .chat-monitor-layout { grid-template-columns:1fr;height:auto; } }
  `]
})
export class AdminChatsComponent {
  private adminService = inject(AdminService);

  convos         = signal<any[]>([]);
  filteredConvos = signal<any[]>([]);
  selectedConvo  = signal<any | null>(null);
  messages       = signal<any[]>([]);
  loadingConvos  = signal(true);
  loadingMsgs    = signal(false);
  search         = '';

  constructor() { this.loadConvos(); }

  loadConvos() {
    this.loadingConvos.set(true);
    this.adminService.getChats().subscribe({
      next: c => {
        this.convos.set(c);
        this.filteredConvos.set(c);
        this.loadingConvos.set(false);
      },
      error: () => this.loadingConvos.set(false)
    });
  }

  filterConvos() {
    const q = this.search.toLowerCase();
    this.filteredConvos.set(
      this.convos().filter(c =>
        !q || c.userAName.toLowerCase().includes(q) ||
              c.userBName.toLowerCase().includes(q) ||
              (c.lastMessage ?? '').toLowerCase().includes(q)
      )
    );
  }

  openConvo(c: any) {
    this.selectedConvo.set(c);
    this.loadingMsgs.set(true);
    this.adminService.getChatMessages(c.userAId, c.userBId).subscribe({
      next: m => { this.messages.set(m); this.loadingMsgs.set(false); },
      error: () => this.loadingMsgs.set(false)
    });
  }

  isSameDay(a: string, b: string) {
    return new Date(a).toDateString() === new Date(b).toDateString();
  }

  initials(name: string) {
    return (name ?? '').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
