package com.brandonkamga.lescracks.account.infra.security;

import com.brandonkamga.lescracks.account.infra.persistence.JdbcLastSeen;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// A @Bean rather than a @Component: web slice tests pick up every Filter component, and this one
// would drag the database into each of them.
@Configuration
public class LastSeenFilterConfig {

    @Bean
    LastSeenFilter lastSeenFilter(JdbcLastSeen lastSeen) {
        return new LastSeenFilter(lastSeen);
    }
}
