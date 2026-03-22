package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.service.interfaces.TagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of TagService.
 */
@Service
@Transactional
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    public TagServiceImpl(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Tag findById(Long id) {
        return tagRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Tag> findByIdOptional(Long id) {
        return tagRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> findAll() {
        return tagRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Tag> findByName(String name) {
        return tagRepository.findByName(name);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> findByCategoryId(Long categoryId) {
        return tagRepository.findByCategoryId(categoryId);
    }

    @Override
    public Tag save(Tag tag) {
        return tagRepository.save(tag);
    }

    @Override
    public void deleteById(Long id) {
        tagRepository.deleteById(id);
    }
}
