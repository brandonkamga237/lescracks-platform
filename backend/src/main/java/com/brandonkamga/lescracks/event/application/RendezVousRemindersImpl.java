package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.DueReminder;
import com.brandonkamga.lescracks.event.domain.model.ReminderMoment;
import com.brandonkamga.lescracks.event.domain.port.ReminderStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.RendezVousReminderEmail;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RendezVousRemindersImpl implements RendezVousReminders {

    private final ReminderStore reminders;
    private final MemberDirectory people;
    private final Mailer mail;

    public RendezVousRemindersImpl(ReminderStore reminders, MemberDirectory people, Mailer mail) {
        this.reminders = reminders;
        this.people = people;
        this.mail = mail;
    }

    @Override
    public int sendDue(Instant now) {
        List<DueReminder> due = reminders.findDue(now);
        if (due.isEmpty()) return 0;
        Map<Long, Member> members = people.findAll(due.stream().map(DueReminder::memberId).distinct().toList());

        List<DueReminder> done = new ArrayList<>();
        int sent = 0;
        for (DueReminder reminder : due) {
            Member member = members.get(reminder.memberId());
            // A deleted, suspended or banned account hears nothing more: settled for good.
            if (member == null || !member.isActive()) {
                done.add(reminder);
                continue;
            }
            // An unverified address may not be theirs. The reminder waits, in case they verify before the start.
            if (!member.isEmailVerified()) continue;
            mail.send(new RendezVousReminderEmail(member.getEmail(), member.getFirstName(), reminder.eventTitle(),
                    reminder.eventPath(), reminder.startDate(), reminder.moment() == ReminderMoment.HOUR_BEFORE, reminder.location()));
            done.add(reminder);
            sent++;
        }
        reminders.markSent(done, now);
        return sent;
    }
}
