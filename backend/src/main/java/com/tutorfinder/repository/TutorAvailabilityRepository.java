package com.tutorfinder.repository;

import com.tutorfinder.entity.TutorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface TutorAvailabilityRepository extends JpaRepository<TutorAvailability, Long> {
    List<TutorAvailability> findByTutorProfileId(Long tutorProfileId);
    void deleteByTutorProfileId(Long tutorProfileId);
    List<TutorAvailability> findByTutorProfileIdAndDayOfWeek(Long tutorProfileId, DayOfWeek day);
}
