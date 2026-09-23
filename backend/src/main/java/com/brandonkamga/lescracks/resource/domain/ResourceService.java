package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.resource.api.dto.ArticleResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.EbookResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.VideoResourceRequest;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ResourceService {
    List<Resource> published();
    Page<Resource> search(ResourceStatus status, String search, String kind, Long categoryId, Long tagId, Pageable pageable);
    Resource requirePublished(Long id);
    Resource require(Long id);
    Resource requirePublishedBySlugOrId(String slugOrId);
    Resource requireBySlugOrId(String slugOrId);
    Resource createVideo(VideoResourceRequest request, MultipartFile coverImageFile);
    Resource updateVideo(Long id, VideoResourceRequest request, MultipartFile coverImageFile);
    Resource createEbook(EbookResourceRequest request, MultipartFile file, MultipartFile coverImageFile);
    Resource updateEbook(Long id, EbookResourceRequest request, MultipartFile file, MultipartFile coverImageFile);
    Resource createArticle(ArticleResourceRequest request, MultipartFile coverImageFile);
    Resource updateArticle(Long id, ArticleResourceRequest request, MultipartFile coverImageFile);
    Page<Resource> all(Pageable pageable);
    void delete(Long id);
}
