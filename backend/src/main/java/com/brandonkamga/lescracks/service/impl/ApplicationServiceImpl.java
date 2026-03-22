package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of ApplicationService.
 */
@Service
@Transactional
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Application findById(Long id) {
        return applicationRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Application> findByIdOptional(Long id) {
        return applicationRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Application> findAll() {
        return applicationRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Application> findByUserId(Long userId) {
        return applicationRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Application> findByEventId(Long eventId) {
        return applicationRepository.findByEventId(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Application> findByApplicationTypeId(Long applicationTypeId) {
        return applicationRepository.findByApplicationTypeId(applicationTypeId);
    }

    @Override
    public Application save(Application application) {
        return applicationRepository.save(application);
    }

    @Override
    public void deleteById(Long id) {
        applicationRepository.deleteById(id);
    }
}
