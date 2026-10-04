package com.tutorfinder.service;
import com.tutorfinder.dto.*;
import java.util.List;
public interface MessageService {
    MessageDto sendMessage(Long senderId, SendMessageRequest request);
    List<MessageDto> getConversation(Long user1, Long user2);
    List<MessageDto> getConversationPreviews(Long userId);
    void markAsRead(Long senderId, Long receiverId);
    long getUnreadCount(Long receiverId);
}
