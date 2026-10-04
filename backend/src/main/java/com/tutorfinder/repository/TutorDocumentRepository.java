package com.tutorfinder.repository;

import com.tutorfinder.entity.TutorDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TutorDocumentRepository extends JpaRepository<TutorDocument, Long> {
    List<TutorDocument> findByTutorProfileId(Long tutorProfileId);
    long countByVerified(boolean verified);
}
