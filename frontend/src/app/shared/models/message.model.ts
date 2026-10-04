export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderPicture?: string;
  receiverId: number;
  receiverName?: string;   // needed to show partner name when I sent the last message
  content: string;
  isRead: boolean;
  createdAt: string;
  unreadCount?: number;   // populated in previews — number of unread msgs from this sender
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}
