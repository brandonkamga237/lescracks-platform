package com.brandonkamga.lescracks.engagement.infra.config;

import com.brandonkamga.lescracks.engagement.application.CommentService;
import com.brandonkamga.lescracks.engagement.application.CommentServiceImpl;
import com.brandonkamga.lescracks.engagement.application.ContentTargets;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.application.ReactionService;
import com.brandonkamga.lescracks.engagement.application.ReactionServiceImpl;
import com.brandonkamga.lescracks.engagement.application.TargetRegistry;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReactionStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReportStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/** Builds engagement's use cases; the content modules plug in as ContentTargets beans. */
@Configuration
public class EngagementServices {

    private final TransactionalServices transactional;

    public EngagementServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    // ContentTargets implementations must depend on their repositories only: a content service
    // reading engagement's counts would close a cycle through this registry.
    @Bean
    TargetRegistry targetRegistry(List<ContentTargets> targets) {
        return new TargetRegistry(targets);
    }

    // One stateless implementation behind two narrow interfaces, each its own bean.
    @Bean
    ReactionService reactionService(ReactionStore reactions, CommentStore comments, TargetRegistry targets, MemberDirectory people) {
        return transactional.wrap(ReactionService.class, new ReactionServiceImpl(reactions, comments, targets, people));
    }

    @Bean
    EngagementCounts engagementCounts(ReactionStore reactions, CommentStore comments, TargetRegistry targets, MemberDirectory people) {
        return transactional.wrap(EngagementCounts.class, new ReactionServiceImpl(reactions, comments, targets, people));
    }

    @Bean
    CommentService commentService(CommentStore comments, ReportStore reports, TargetRegistry targets,
                                  MemberDirectory people, Mailer mailer) {
        return transactional.wrap(CommentService.class, new CommentServiceImpl(comments, reports, targets, people, mailer));
    }
}
