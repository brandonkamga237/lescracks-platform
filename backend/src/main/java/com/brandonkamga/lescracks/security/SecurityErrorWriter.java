package com.brandonkamga.lescracks.security;

import com.brandonkamga.lescracks.dto.common.ApiError;
import com.brandonkamga.lescracks.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * The body a rejected request gets back.
 *
 * Spring Security answers inside the filter chain, before any controller advice runs, so
 * GlobalExceptionHandler never sees a 401 or a 403 — it was writing handlers that could not
 * fire, and the client received an empty body with nothing to branch on. This writes the
 * same ApiError shape the rest of the API uses, so a failure looks the same wherever it
 * came from.
 */
@Component
public class SecurityErrorWriter implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper json;

    public SecurityErrorWriter(ObjectMapper json) {
        this.json = json;
    }

    /** No token, or one that does not verify. */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         org.springframework.security.core.AuthenticationException failure) throws IOException {
        write(request, response, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHENTICATED,
                "Vous devez être connecté pour accéder à cette ressource.");
    }

    /** A valid token, but not the role this route asks for. */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       org.springframework.security.access.AccessDeniedException denied) throws IOException {
        write(request, response, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN,
                "Vous n'avez pas les droits nécessaires pour cette action.");
    }

    private void write(HttpServletRequest request, HttpServletResponse response,
                       HttpStatus status, ErrorCode code, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        json.writeValue(response.getOutputStream(),
                ApiError.of(code, message, request.getRequestURI()));
    }
}
