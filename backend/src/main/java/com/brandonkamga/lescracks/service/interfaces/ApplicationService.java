package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Application;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for Application operations.
 */
public interface ApplicationService {

    /**
     * Find an application by ID.
     *
     * @param id the application ID
     * @return the application if found
     */
    Application findById(Long id);

    /**
     * Find an application by ID as Optional.
     *
     * @param id the application ID
     * @return Optional containing the application if found
     */
    Optional<Application> findByIdOptional(Long id);

    /**
     * Find all applications.
     *
     * @return list of all applications
     */
    List<Application> findAll();

    /**
     * Find applications by user ID.
     *
     * @param userId the user ID
     * @return list of applications for the specified user
     */
    List<Application> findByUserId(Long userId);

    /**
     * Find applications by event ID.
     *
     * @param eventId the event ID
     * @return list of applications for the specified event
     */
    List<Application> findByEventId(Long eventId);

    /**
     * Find applications by application type ID.
     *
     * @param applicationTypeId the application type ID
     * @return list of applications with the specified type
     */
    List<Application> findByApplicationTypeId(Long applicationTypeId);

    /**
     * Save an application.
     *
     * @param application the application to save
     * @return the saved application
     */
    Application save(Application application);

    /**
     * Delete an application by ID.
     *
     * @param id the application ID
     */
    void deleteById(Long id);
}
