package com.brandonkamga.lescracks.member.infra.config;

import com.brandonkamga.lescracks.account.application.AccountAdminService;
import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.member.application.MemberAdminService;
import com.brandonkamga.lescracks.member.application.MemberAdminServiceImpl;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.member.application.MemberDirectoryImpl;
import com.brandonkamga.lescracks.member.application.ProfileService;
import com.brandonkamga.lescracks.member.application.ProfileServiceImpl;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds member's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class MemberServices {

    private final TransactionalServices transactional;

    public MemberServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    ProfileService profileService(AccountDirectory accounts, MemberProfileStore profiles, StorageService storage,
                                  TaxonomyService taxonomy) {
        return transactional.wrap(ProfileService.class, new ProfileServiceImpl(accounts, profiles, storage, taxonomy));
    }

    @Bean
    MemberDirectory memberDirectory(AccountDirectory accounts, MemberProfileStore profiles) {
        return transactional.wrap(MemberDirectory.class, new MemberDirectoryImpl(accounts, profiles));
    }

    @Bean
    MemberAdminService memberAdminService(AccountAdminService accounts, MemberProfileStore profiles) {
        return transactional.wrap(MemberAdminService.class, new MemberAdminServiceImpl(accounts, profiles));
    }
}
