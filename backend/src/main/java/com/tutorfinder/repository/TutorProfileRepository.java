package com.tutorfinder.repository;

import com.tutorfinder.entity.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TutorProfileRepository extends JpaRepository<TutorProfile, Long> {

    Optional<TutorProfile> findByUserId(Long userId);

    @Query(value = """
        SELECT t.*,
               CASE
                 WHEN t.latitude IS NOT NULL AND t.longitude IS NOT NULL
                 THEN (6371 * acos(
                        cos(radians(:lat)) * cos(radians(t.latitude)) *
                        cos(radians(t.longitude) - radians(:lng)) +
                        sin(radians(:lat)) * sin(radians(t.latitude))
                      ))
                 ELSE NULL
               END AS distance
        FROM tutor_profiles t
        JOIN users u ON t.user_id = u.id
        WHERE t.is_available = true
          AND u.is_active = true
          AND u.role = 'TUTOR'
          AND (:subjectId IS NULL OR t.id IN (
                SELECT ts.tutor_id FROM tutor_subjects ts WHERE ts.subject_id = :subjectId))
          AND (:minRate IS NULL OR t.hourly_rate >= :minRate)
          AND (:maxRate IS NULL OR t.hourly_rate <= :maxRate)
          AND (:mode IS NULL OR t.teaching_mode = :mode OR t.teaching_mode = 'BOTH')
          AND (:standard IS NULL OR FIND_IN_SET(:standard, t.teaching_standard) > 0)
          AND (:minRating IS NULL OR t.average_rating >= :minRating)
          AND (:minExperience IS NULL OR t.experience_years >= :minExperience)
          AND (
               t.latitude IS NOT NULL AND t.longitude IS NOT NULL
               AND (6371 * acos(
                  cos(radians(:lat)) * cos(radians(t.latitude)) *
                  cos(radians(t.longitude) - radians(:lng)) +
                  sin(radians(:lat)) * sin(radians(t.latitude))
               )) <= :radiusKm
              )
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<TutorProfile> findNearbyTutors(
        @Param("lat")           double latitude,
        @Param("lng")           double longitude,
        @Param("radiusKm")      double radiusKm,
        @Param("subjectId")     Long subjectId,
        @Param("minRate")       Double minRate,
        @Param("maxRate")       Double maxRate,
        @Param("mode")          String mode,
        @Param("standard")      String standard,
        @Param("minRating")     Double minRating,
        @Param("minExperience") Integer minExperience
    );
}
