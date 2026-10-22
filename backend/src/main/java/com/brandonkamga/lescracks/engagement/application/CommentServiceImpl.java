package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReportStore;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.shared.util.PlainText;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class CommentServiceImpl implements CommentService {
    // Enough for a lively discussion, too few for a script pasting the same message everywhere.
    static final int BURST_LIMIT = 10;
    static final Duration BURST_WINDOW = Duration.ofMinutes(10);

    private final CommentStore comments;
    private final ReportStore reports;
    private final TargetRegistry targets;
    private final MemberDirectory people;
    private final Mailer mailer;

    public CommentServiceImpl(CommentStore comments, ReportStore reports, TargetRegistry targets,
                              MemberDirectory people, Mailer mailer) {
        this.comments = comments;
        this.reports = reports;
        this.targets = targets;
        this.people = people;
        this.mailer = mailer;
    }

    @Override
    public List<CommentThread> listThreads(Target target) {
        targets.requireOpen(target);
        List<Comment> all = comments.findByTarget(target);
        Map<Long, Member> authors = people.findAll(all.stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
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
    public CommentView post(String email, Target target, CommentDraft draft) {
        targets.requireOpen(target);
        Member author = people.require(email);
        String body = Comment.clean(draft.body());
        if (comments.countByAuthorSince(author.getId(), Instant.now().minus(BURST_WINDOW)) >= BURST_LIMIT) {
            throw new BadRequestException("Tu as beaucoup commenté en peu de temps : réessaie dans quelques minutes.");
        }
        Comment parent = null;
        if (draft.parentId() != null) {
            parent = require(draft.parentId());
            if (!parent.target().equals(target)) throw new BadRequestException("Ce commentaire n’appartient pas à cette page.");
            // Answering a reply joins the same thread: discussions stay one level deep.
            if (parent.isReply()) parent = require(parent.getParentId());
            if (!parent.isVisible()) throw new BadRequestException("Ce commentaire n’accepte plus de réponses.");
        }
        Comment saved = comments.save(Comment.builder()
                .targetType(target.type())
                .targetId(target.id())
                .authorId(author.getId())
                .parentId(parent == null ? null : parent.getId())
                .body(body)
                .build());
        if (parent != null) notifyAnswered(parent, author, body);
        return new CommentView(saved, author);
    }

    private void notifyAnswered(Comment parent, Member replier, String body) {
        if (parent.getAuthorId().equals(replier.getId())) return;
        Member answered = people.findAll(Set.of(parent.getAuthorId())).get(parent.getAuthorId());
        TargetPage page = targets.describe(parent.getTargetType(), Set.of(parent.getTargetId())).get(parent.getTargetId());
        if (answered == null || answered.getEmail() == null || page == null) return;
        mailer.send(new CommentReplyEmail(answered.getEmail(), answered.getFirstName(), displayName(replier), page.title(),
                PlainText.excerpt(body, 280), page.path() + "#commentaire-" + parent.getId()));
    }

    @Override
    public CommentView edit(String email, Long commentId, String body) {
        Member author = people.require(email);
        Comment comment = owned(commentId, author);
        comment.edit(body);
        return new CommentView(comments.save(comment), author);
    }

    @Override
    public void delete(String email, Long commentId) {
        Comment comment = owned(commentId, people.require(email));
        comment.setStatus(CommentStatus.DELETED);
        comments.save(comment);
    }

    @Override
    public void report(String email, Long commentId, String reason) {
        Member reporter = people.require(email);
        Comment comment = require(commentId);
        if (comment.getAuthorId().equals(reporter.getId())) throw new BadRequestException("Tu ne peux pas signaler ton propre commentaire.");
        if (reports.exists(commentId, reporter.getId())) throw new ConflictException("Tu as déjà signalé ce commentaire.");
        reports.add(commentId, reporter.getId(), reason == null || reason.isBlank() ? null : reason.strip());
        comment.reported();
        comments.save(comment);
    }

    @Override
    public Paged<ModeratedComment> listForModeration(boolean reportedOnly, PageQuery page) {
        Paged<Comment> found = comments.findForModeration(reportedOnly, page);
        List<Comment> list = found.items();
        Map<Long, Member> authors = people.findAll(list.stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
        Map<Long, List<String>> reasons = reports.reasonsOf(list.stream().filter(c -> c.getReportCount() > 0).map(Comment::getId).toList());
        Map<TargetType, Map<Long, TargetPage>> pages = new EnumMap<>(TargetType.class);
        list.stream().collect(Collectors.groupingBy(Comment::getTargetType, Collectors.mapping(Comment::getTargetId, Collectors.toSet())))
                .forEach((type, ids) -> pages.put(type, targets.describe(type, ids)));
        return found.map(comment -> new ModeratedComment(comment, authors.get(comment.getAuthorId()),
                pages.getOrDefault(comment.getTargetType(), Map.of()).get(comment.getTargetId()),
                reasons.getOrDefault(comment.getId(), List.of())));
    }

    @Override
    public ModeratedComment moderate(Long commentId, CommentStatus status) {
        Comment comment = require(commentId);
        comment.moderate(status);
        Comment saved = comments.save(comment);
        Member author = people.findAll(Set.of(saved.getAuthorId())).get(saved.getAuthorId());
        TargetPage page = targets.describe(saved.getTargetType(), Set.of(saved.getTargetId())).get(saved.getTargetId());
        List<String> reasons = saved.getReportCount() == 0 ? List.of() : reports.reasonsOf(Set.of(saved.getId())).getOrDefault(saved.getId(), List.of());
        return new ModeratedComment(saved, author, page, reasons);
    }

    @Override
    public void erase(Long commentId) {
        comments.delete(require(commentId).getId());
    }

    private Comment require(Long id) {
        return comments.findById(id).orElseThrow(() -> new NotFoundException("Comment", "id", id));
    }

    private Comment owned(Long id, Member author) {
        Comment comment = require(id);
        if (!comment.getAuthorId().equals(author.getId())) throw new ForbiddenException("Ce commentaire n’est pas le tien.");
        if (comment.getStatus() == CommentStatus.DELETED) throw new NotFoundException("Comment", "id", id);
        return comment;
    }

    static String displayName(Member member) {
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return name.isEmpty() ? "Membre LesCracks" : name;
    }
}
