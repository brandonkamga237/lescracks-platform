package com.brandonkamga.lescracks.identity.infra.security;

import com.brandonkamga.lescracks.identity.infra.persistence.UserJpaRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// A @Bean rather than a @Component: web slice tests pick up every Filter component, and this one
// would drag the users repository into each of them.
@Configuration
public class LastSeenFilterConfig {

    @Bean
    LastSeenFilter lastSeenFilter(UserJpaRepository users) {
        return new LastSeenFilter(users);
    }
}
