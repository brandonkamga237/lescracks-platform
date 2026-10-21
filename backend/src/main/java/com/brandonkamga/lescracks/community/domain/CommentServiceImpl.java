package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.community.infra.CommentReportRepository;
import com.brandonkamga.lescracks.community.infra.CommentRepository;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.PlainText;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {
    static final int MAX_LENGTH = 2000;
    static final int HIDE_AFTER_REPORTS = 3;
    // Enough for a lively discussion, too few for a script pasting the same message everywhere.
    static final int BURST_LIMIT = 10;
    static final Duration BURST_WINDOW = Duration.ofMinutes(10);

    private final CommentRepository comments;
    private final CommentReportRepository reports;
    private final ResourceService resources;
    private final UserDirectory people;
    private final Mailer mailer;

    public CommentServiceImpl(CommentRepository comments, CommentReportRepository reports, ResourceService resources,
                              UserDirectory people, Mailer mailer) {
        this.comments = comments;
        this.reports = reports;
        this.resources = resources;
        this.people = people;
        this.mailer = mailer;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentThread> threads(Long resourceId) {
        resources.requirePublished(resourceId);
        List<Comment> all = comments.findByResourceIdOrderByCreatedAtAsc(resourceId);
        Map<Long, User> authors = people.findAll(all.stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
        Map<Long, List<CommentView>> replies = new HashMap<>();
        for (Comment comment : all) {
            if (comment.isReply() && comment.isVisible()) {
                replies.computeIfAbsent(comment.getParentId(), id -> new ArrayList<>()).add(new CommentView(comment, authors.get(comment.getAuthorId())));
            }
        }
        List<CommentThread> threads = new ArrayList<>();
        for (Comment root : all) {
            if (root.isReply()) continue;
            List<CommentView> answers = replies.getOrDefault(root.getId(), List.of());
            // A removed comment that was answered leaves a placeholder: the replies would read as nonsense alone.
            if (!root.isVisible() && answers.isEmpty()) continue;
            threads.add(new CommentThread(new CommentView(root, root.isVisible() ? authors.get(root.getAuthorId()) : null), answers));
        }
        return threads;
    }

    @Override
    public CommentView post(String email, Long resourceId, CommentDraft draft) {
        Resource resource = resources.requirePublished(resourceId);
        User author = people.require(email);
        String body = cleaned(draft.body());
        if (comments.countByAuthorIdAndCreatedAtAfter(author.getId(), Instant.now().minus(BURST_WINDOW)) >= BURST_LIMIT) {
            throw new BadRequestException("Tu as beaucoup commenté en peu de temps : réessaie dans quelques minutes.");
        }
        Comment parent = null;
        if (draft.parentId() != null) {
            parent = require(draft.parentId());
            if (!parent.getResourceId().equals(resourceId)) throw new BadRequestException("Ce commentaire n’appartient pas à cet article.");
            // Answering a reply joins the same thread: discussions stay one level deep.
            if (parent.isReply()) parent = require(parent.getParentId());
            if (!parent.isVisible()) throw new BadRequestException("Ce commentaire n’accepte plus de réponses.");
        }
        Comment saved = comments.save(Comment.builder()
                .resourceId(resourceId)
                .authorId(author.getId())
                .parentId(parent == null ? null : parent.getId())
                .body(body)
                .build());
        if (parent != null) notifyAnswered(parent, author, resource, body);
        return new CommentView(saved, author);
    }

    private void notifyAnswered(Comment parent, User replier, Resource resource, String body) {
        if (parent.getAuthorId().equals(replier.getId())) return;
        User answered = people.findAll(Set.of(parent.getAuthorId())).get(parent.getAuthorId());
        if (answered == null || answered.getEmail() == null) return;
        String path = "/blog/" + (resource.getSlug() == null || resource.getSlug().isBlank() ? resource.getId() : resource.getSlug())
                + "#commentaire-" + parent.getId();
        mailer.send(new CommentReplyEmail(answered.getEmail(), answered.getFirstName(), displayName(replier), resource.getTitle(),
                PlainText.excerpt(body, 280), path));
    }

    @Override
    public CommentView edit(String email, Long commentId, String body) {
        User author = people.require(email);
        Comment comment = owned(commentId, author);
        if (!comment.isVisible()) throw new BadRequestException("Ce commentaire ne peut plus être modifié.");
        comment.setBody(cleaned(body));
        comment.setEditedAt(Instant.now());
        return new CommentView(comment, author);
    }

    @Override
    public void delete(String email, Long commentId) {
        Comment comment = owned(commentId, people.require(email));
        comment.setStatus(CommentStatus.DELETED);
    }

    @Override
    public void report(String email, Long commentId, String reason) {
        User reporter = people.require(email);
        Comment comment = require(commentId);
        if (comment.getAuthorId().equals(reporter.getId())) throw new BadRequestException("Tu ne peux pas signaler ton propre commentaire.");
        if (reports.existsByCommentIdAndReporterId(commentId, reporter.getId())) throw new ConflictException("Tu as déjà signalé ce commentaire.");
        String why = reason == null || reason.isBlank() ? null : reason.strip();
        reports.save(CommentReport.builder().commentId(commentId).reporterId(reporter.getId()).reason(why).build());
        comment.setReportCount(comment.getReportCount() + 1);
        // Post-moderation needs a fuse for the hours the admin is away.
        if (comment.isVisible() && comment.getReportCount() >= HIDE_AFTER_REPORTS) comment.setStatus(CommentStatus.HIDDEN);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ModeratedComment> moderation(boolean reportedOnly, Pageable pageable) {
        Page<Comment> page = reportedOnly ? comments.findReported(pageable) : comments.findRecent(pageable);
        Map<Long, User> authors = people.findAll(page.getContent().stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
        Map<Long, Resource> articles = new LinkedHashMap<>();
        return page.map(comment -> moderated(comment, authors.get(comment.getAuthorId()),
                articles.computeIfAbsent(comment.getResourceId(), resources::require)));
    }

    @Override
    public ModeratedComment moderate(Long commentId, CommentStatus status) {
        if (status == CommentStatus.DELETED) throw new BadRequestException("Pour supprimer un commentaire, utilise la suppression.");
        Comment comment = require(commentId);
        if (comment.getStatus() == CommentStatus.DELETED) throw new BadRequestException("Son auteur a supprimé ce commentaire.");
        comment.setStatus(status);
        if (status == CommentStatus.VISIBLE) comment.setReportCount(0);
        return moderated(comment, people.require(comment.getAuthorId()), resources.require(comment.getResourceId()));
    }

    @Override
    public void erase(Long commentId) {
        comments.delete(require(commentId));
    }

    private ModeratedComment moderated(Comment comment, User author, Resource resource) {
        List<String> reasons = comment.getReportCount() == 0 ? List.of()
                : reports.findByCommentIdOrderByCreatedAtDesc(comment.getId()).stream().map(CommentReport::getReason).filter(r -> r != null).toList();
        return new ModeratedComment(comment, author, resource, reasons);
    }

    private Comment require(Long id) {
        return comments.findById(id).orElseThrow(() -> new NotFoundException("Comment", "id", id));
    }

    private Comment owned(Long id, User author) {
        Comment comment = require(id);
        if (!comment.getAuthorId().equals(author.getId())) throw new ForbiddenException("Ce commentaire n’est pas le tien.");
        if (comment.getStatus() == CommentStatus.DELETED) throw new NotFoundException("Comment", "id", id);
        return comment;
    }

    /** Plain text, trimmed, without runs of blank lines or invisible control characters. */
    static String cleaned(String body) {
        String text = body == null ? "" : body.replaceAll("[\\p{Cntrl}&&[^\n\t]]", "").replaceAll("\n{3,}", "\n\n").strip();
        if (text.length() < 2) throw new BadRequestException("Ton commentaire est vide.");
        if (text.length() > MAX_LENGTH) throw new BadRequestException("Ton commentaire dépasse " + MAX_LENGTH + " caractères.");
        return text;
    }

    static String displayName(User member) {
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return name.isEmpty() ? "Membre LesCracks" : name;
    }
}
