package com.brandonkamga.lescracks.engagement.domain.port;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Members flagging comments for the admin. */
public interface ReportStore {

    boolean exists(Long commentId, Long reporterId);

    void add(Long commentId, Long reporterId, String reason);

    /** The reasons given, newest first, for several comments in one query. */
    Map<Long, List<String>> reasonsOf(Collection<Long> commentIds);
}
