package com.tutorfinder.repository;

import com.tutorfinder.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m FROM Message m 
        WHERE (m.sender.id = :user1 AND m.receiver.id = :user2)
           OR (m.sender.id = :user2 AND m.receiver.id = :user1)
        ORDER BY m.createdAt ASC
        """)
    List<Message> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("""
        SELECT DISTINCT CASE 
            WHEN m.sender.id = :userId THEN m.receiver.id 
            ELSE m.sender.id END
        FROM Message m
        WHERE m.sender.id = :userId OR m.receiver.id = :userId
        """)
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);

    /** Total unread messages for a given receiver — used for navbar badge */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :receiverId AND m.isRead = false")
    long countUnreadByReceiverId(@Param("receiverId") Long receiverId);
    /** All messages between two specific users ordered by time */
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :aId AND m.receiver.id = :bId) OR (m.sender.id = :bId AND m.receiver.id = :aId) ORDER BY m.createdAt ASC")
    List<Message> findConversationBetween(@Param("aId") Long aId, @Param("bId") Long bId);

    /** Latest message per unique user-pair for admin conversation list */
    @Query(value = """
        SELECT
            LEAST(m.sender_id, m.receiver_id)   AS userA,
            GREATEST(m.sender_id, m.receiver_id) AS userB,
            MAX(m.id) AS lastMsgId
        FROM messages m
        GROUP BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id)
        ORDER BY lastMsgId DESC
        """, nativeQuery = true)
    List<Object[]> findConversationPairsRaw();

}
