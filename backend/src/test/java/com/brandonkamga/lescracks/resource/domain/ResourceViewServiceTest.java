package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceViewServiceTest {

    @Mock private ResourceRepository resources;

    private ResourceViewServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ResourceViewServiceImpl(resources);
    }

    private void stub(ResourceStatus status) {
        when(resources.findById(4L)).thenReturn(Optional.of(Resource.builder().id(4L).status(status).build()));
    }

    @Test
    @DisplayName("a new reader adds one view, a returning one does not")
    void countsEachReaderOnce() {
        stub(ResourceStatus.PUBLISHED);
        when(resources.insertView(4L, "a:x")).thenReturn(1, 0);
        when(resources.viewCount(4L)).thenReturn(8);

        assertThat(service.recordView(4L, "a:x")).isEqualTo(8);
        service.recordView(4L, "a:x");

        verify(resources, times(1)).incrementViews(4L);
    }

    @Test
    @DisplayName("a draft counts nobody")
    void draftsAreNotCounted() {
        stub(ResourceStatus.DRAFT);

        assertThatThrownBy(() -> service.recordView(4L, "a:x")).isInstanceOf(NotFoundException.class);
        verify(resources, never()).insertView(anyLong(), any());
    }
}
