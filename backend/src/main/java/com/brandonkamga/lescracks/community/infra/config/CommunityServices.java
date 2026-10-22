package com.brandonkamga.lescracks.community.infra.config;

import com.brandonkamga.lescracks.community.application.PublicProfileService;
import com.brandonkamga.lescracks.community.application.PublicProfileServiceImpl;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.application.BadgeService;
import com.brandonkamga.lescracks.recognition.application.CertificateService;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Public profiles read three modules; one read-only transaction keeps the picture consistent. */
@Configuration
public class CommunityServices {

    @Bean
    PublicProfileService publicProfileService(TransactionalServices transactional, MemberDirectory people, BadgeService badges,
                                              CertificateService certificates) {
        return transactional.wrap(PublicProfileService.class, new PublicProfileServiceImpl(people, badges, certificates));
    }
}
