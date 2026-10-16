package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.Email;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class EmailTemplates {
    private final Map<Class<?>, EmailTemplate<?>> byType = new HashMap<>();

    public EmailTemplates(List<EmailTemplate<?>> templates) {
        for (EmailTemplate<?> template : templates) {
            if (byType.put(template.type(), template) != null) {
                throw new IllegalStateException("Two templates render " + template.type().getSimpleName());
            }
        }
    }

    @SuppressWarnings("unchecked")
    public <T extends Email> RenderedEmail render(T email) {
        EmailTemplate<T> template = (EmailTemplate<T>) byType.get(email.getClass());
        if (template == null) {
            throw new IllegalStateException("No template renders " + email.getClass().getSimpleName());
        }
        return template.render(email);
    }
}
