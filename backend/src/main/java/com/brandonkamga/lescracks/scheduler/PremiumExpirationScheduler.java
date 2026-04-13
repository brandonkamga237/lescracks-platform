package com.brandonkamga.lescracks.scheduler;

import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.impl.MailServiceImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PremiumExpirationScheduler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final MailServiceImpl mailService;

    public PremiumExpirationScheduler(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      MailServiceImpl mailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.mailService = mailService;
    }

    /**
     * Runs daily at midnight. Handles expiration downgrades and email reminders.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void processPremiumExpirations() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Downgrade expired premium users
        List<User> expired = userRepository.findExpiredPremiumUsers(now);
        var userRole = roleRepository.findByName(RoleName.user).orElse(null);

        for (User user : expired) {
            String email = user.getPremiumContactEmail();
            String username = user.getUsername();
            user.setRole(userRole);
            user.setPremiumActivatedAt(null);
            user.setPremiumExpiresAt(null);
            userRepository.save(user);
            if (email != null) {
                mailService.sendPremiumExpired(email, username);
            }
        }

        // 2. Send J-7 reminders
        LocalDateTime in7Days = now.toLocalDate().plusDays(7).atStartOfDay();
        LocalDateTime in8Days = now.toLocalDate().plusDays(8).atStartOfDay();
        List<User> remind7 = userRepository.findPremiumUsersExpiringBetween(in7Days, in8Days);
        for (User user : remind7) {
            String email = user.getPremiumContactEmail();
            if (email != null) {
                mailService.sendPremiumReminder(email, user.getUsername(), user.getPremiumExpiresAt(), 7);
            }
        }

        // 3. Send J-1 reminders
        LocalDateTime in1Day = now.toLocalDate().plusDays(1).atStartOfDay();
        LocalDateTime in2Days = now.toLocalDate().plusDays(2).atStartOfDay();
        List<User> remind1 = userRepository.findPremiumUsersExpiringBetween(in1Day, in2Days);
        for (User user : remind1) {
            String email = user.getPremiumContactEmail();
            if (email != null) {
                mailService.sendPremiumReminder(email, user.getUsername(), user.getPremiumExpiresAt(), 1);
            }
        }
    }
}
