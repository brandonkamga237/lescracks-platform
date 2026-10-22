package com.brandonkamga.lescracks.resource.domain;

/** How many different people opened an article. */
public interface ResourceViewService {

    /** Counts the reader once per article; returns the article's figure afterwards. Only published articles count. */
    int recordView(Long resourceId, String visitorKey);
}
