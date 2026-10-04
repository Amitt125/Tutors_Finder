package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.User;
import com.tutorfinder.repository.UserRepository;
import com.tutorfinder.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService        messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository        userRepo;

    @PostMapping
    public ResponseEntity<ApiResponse<MessageDto>> send(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SendMessageRequest req) {

        MessageDto msg = messageService.sendMessage(user.getId(), req);

        // Look up receiver's email — Spring WebSocket identifies users by their
        // Principal name which is the email (getUsername() returns email)
        String receiverEmail = userRepo.findById(req.getReceiverId())
            .map(User::getEmail)
            .orElse(null);

        if (receiverEmail != null) {
            // Push real-time message to receiver's WebSocket session
            messagingTemplate.convertAndSendToUser(
                receiverEmail, "/queue/messages", msg);

            // Push updated unread count to receiver
            long unread = messageService.getUnreadCount(req.getReceiverId());
            messagingTemplate.convertAndSendToUser(
                receiverEmail, "/queue/unread-count", Map.of("count", unread));
        }

        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @GetMapping("/conversation/{partnerId}")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getConversation(
            @AuthenticationPrincipal User user,
            @PathVariable Long partnerId) {
        messageService.markAsRead(partnerId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(
            messageService.getConversation(user.getId(), partnerId)));
    }

    @GetMapping("/previews")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getPreviews(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
            messageService.getConversationPreviews(user.getId())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
            messageService.getUnreadCount(user.getId())));
    }
}
