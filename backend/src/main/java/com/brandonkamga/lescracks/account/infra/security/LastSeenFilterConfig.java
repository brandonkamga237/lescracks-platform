package com.brandonkamga.lescracks.account.infra.security;

import com.brandonkamga.lescracks.account.infra.persistence.JdbcLastSeen;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
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

    // Boot would also register the bean in the servlet chain, ahead of authentication; it
    // belongs inside the security chain only.
    @Bean
    FilterRegistrationBean<LastSeenFilter> lastSeenFilterOutsideSecurity(LastSeenFilter filter) {
        FilterRegistrationBean<LastSeenFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
