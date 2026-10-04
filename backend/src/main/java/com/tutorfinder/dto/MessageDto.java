package com.tutorfinder.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long          id;
    private Long          senderId;
    private String        senderName;
    private String        senderPicture;
    private Long          receiverId;
    private String        receiverName;    // needed to show partner name in sidebar
    private String        content;
    private boolean       isRead;
    private LocalDateTime createdAt;

    // Number of unread messages from this sender — populated in previews only
    private long unreadCount;
}
