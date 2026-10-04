package com.tutorfinder.controller;

import com.tutorfinder.dto.*;
import com.tutorfinder.entity.Subject;
import com.tutorfinder.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectRepository subjectRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectDto>>> getAll() {
        List<SubjectDto> subjects = subjectRepo.findAll().stream()
            .map(s -> SubjectDto.builder().id(s.getId()).name(s.getName()).category(s.getCategory()).build())
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(subjects));
    }
}
