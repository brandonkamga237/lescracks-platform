package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.dto.resource.ResourceResponse;
import com.brandonkamga.lescracks.repository.EbookRepository;
import com.brandonkamga.lescracks.repository.ExternalVideoReferenceRepository;
import com.brandonkamga.lescracks.repository.ResourceLikeRepository;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ResourceMapper {
    private final EbookRepository ebooks;
    private final ExternalVideoReferenceRepository videos;
    private final ResourceLikeRepository likes;

    public ResourceMapper(EbookRepository ebooks, ExternalVideoReferenceRepository videos,
                          ResourceLikeRepository likes) {
        this.ebooks = ebooks;
        this.videos = videos;
        this.likes = likes;
    }

    public ResourceResponse toResponse(Resource resource) {
        var ebook = ebooks.findByResourceId(resource.getId()).orElse(null);
        var video = videos.findByResourceId(resource.getId()).orElse(null);
        String kind = ebook != null ? "EBOOK" : "EXTERNAL_VIDEO";
        return new ResourceResponse(
                resource.getId(), resource.getTitle(), resource.getDescription(), resource.getCoverImage(),
                resource.getStatus(), resource.getCategory().getId(), resource.getCategory().getName(), kind,
                video == null ? null : video.getVideoUrl(), video == null ? null : video.getPlatform(),
                ebook == null ? null : "/api/resources/" + resource.getId() + "/download",
                ebook == null ? null : ebook.getDocument().getFormat(),
                ebook == null ? null : ebook.getDocument().getFileSize(),
                resource.getTags().stream().map(tag -> tag.getName()).collect(Collectors.toSet()),
                likes.countByResourceId(resource.getId()),
                resource.getCreatedAt(), resource.getUpdatedAt());
    }
}
