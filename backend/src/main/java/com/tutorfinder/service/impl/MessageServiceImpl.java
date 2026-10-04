package com.tutorfinder.service.impl;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.*;
import com.tutorfinder.repository.*;
import com.tutorfinder.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepo;
    private final UserRepository    userRepo;

    @Override @Transactional
    public MessageDto sendMessage(Long senderId, SendMessageRequest req) {
        User sender   = userRepo.findById(senderId).orElseThrow();
        User receiver = userRepo.findById(req.getReceiverId()).orElseThrow();
        Message msg   = Message.builder()
            .sender(sender).receiver(receiver).content(req.getContent()).build();
        return mapToDto(messageRepo.save(msg), 0);
    }

    @Override
    public List<MessageDto> getConversation(Long user1, Long user2) {
        return messageRepo.findConversation(user1, user2).stream()
            .map(m -> mapToDto(m, 0))
            .collect(Collectors.toList());
    }

    @Override
    public List<MessageDto> getConversationPreviews(Long userId) {
        List<Long> partnerIds = messageRepo.findConversationPartnerIds(userId);
        return partnerIds.stream().map(partnerId -> {
            List<Message> msgs = messageRepo.findConversation(userId, partnerId);
            if (msgs.isEmpty()) return null;
            Message last = msgs.get(msgs.size() - 1);
            // Count unread messages sent by this partner to the current user
            long unread = messageRepo.countBySenderIdAndReceiverIdAndIsReadFalse(partnerId, userId);
            return mapToDto(last, unread);
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    @Override @Transactional
    public void markAsRead(Long senderId, Long receiverId) {
        List<Message> unread = messageRepo.findConversation(senderId, receiverId).stream()
            .filter(m -> m.getReceiver().getId().equals(receiverId) && !m.isRead())
            .collect(Collectors.toList());
        unread.forEach(m -> m.setRead(true));
        messageRepo.saveAll(unread);
    }

    @Override
    public long getUnreadCount(Long receiverId) {
        return messageRepo.countUnreadByReceiverId(receiverId);
    }

    private MessageDto mapToDto(Message m, long unreadCount) {
        return MessageDto.builder()
            .id(m.getId())
            .senderId(m.getSender().getId())
            .senderName(m.getSender().getFullName())
            .senderPicture(m.getSender().getProfilePicture())
            .receiverId(m.getReceiver().getId())
            .receiverName(m.getReceiver().getFullName())
            .content(m.getContent())
            .isRead(m.isRead())
            .createdAt(m.getCreatedAt())
            .unreadCount(unreadCount)
            .build();
    }
}
