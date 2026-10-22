package com.brandonkamga.lescracks.engagement.api;

import com.brandonkamga.lescracks.engagement.api.dto.LikeStatusResponse;
import com.brandonkamga.lescracks.engagement.api.dto.ViewCountResponse;
import com.brandonkamga.lescracks.engagement.api.dto.ViewRequest;
import com.brandonkamga.lescracks.engagement.application.ReactionService;
import com.brandonkamga.lescracks.engagement.domain.model.Target;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/** Views count everyone, anonymous visitors included; likes need an account, reading them does not. */
@RestController
@RequestMapping("/api")
public class ReactionController {
    private final ReactionService reactions;

    public ReactionController(ReactionService reactions) {
        this.reactions = reactions;
    }

    @PostMapping("/resources/{id}/views")
    public ViewCountResponse viewArticle(@PathVariable Long id, @RequestBody(required = false) ViewRequest request,
                                         Authentication authentication) {
        return view(Target.article(id), request, authentication);
    }

    @PostMapping("/events/{id}/views")
    public ViewCountResponse viewEvent(@PathVariable Long id, @RequestBody(required = false) ViewRequest request,
                                       Authentication authentication) {
        return view(Target.event(id), request, authentication);
    }

    private ViewCountResponse view(Target target, ViewRequest request, Authentication authentication) {
        String key = (request != null ? request : new ViewRequest(null)).toVisitorKey(authentication != null ? authentication.getName() : null);
        return new ViewCountResponse(reactions.recordView(target, key));
    }

    @GetMapping("/resources/{id}/likes")
    public LikeStatusResponse likes(@PathVariable Long id, Authentication authentication) {
        return LikeStatusResponse.of(reactions.viewLikes(Target.article(id), authentication != null ? authentication.getName() : null));
    }

    @PostMapping("/resources/{id}/likes")
    public LikeStatusResponse like(@PathVariable Long id, Principal principal) {
        return LikeStatusResponse.of(reactions.like(Target.article(id), principal.getName()));
    }

    @DeleteMapping("/resources/{id}/likes")
    public LikeStatusResponse unlike(@PathVariable Long id, Principal principal) {
        return LikeStatusResponse.of(reactions.unlike(Target.article(id), principal.getName()));
    }
}
