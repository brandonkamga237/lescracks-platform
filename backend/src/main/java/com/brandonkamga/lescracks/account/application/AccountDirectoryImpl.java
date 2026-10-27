package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountRenamed;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Instant;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class AccountDirectoryImpl implements AccountDirectory {
    private final AccountStore accounts;
    private final AccountEvents events;

    public AccountDirectoryImpl(AccountStore accounts, AccountEvents events) {
        this.accounts = accounts;
        this.events = events;
    }

    @Override
    public Optional<AccountSummary> find(String email) {
        return accounts.findByEmail(email.trim()).map(AccountSummary::of);
    }

    @Override
    public AccountSummary require(String email) {
        return find(email).orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    @Override
    public AccountSummary require(Long id) {
        return AccountSummary.of(requireAccount(id));
    }

    @Override
    public Map<Long, AccountSummary> findAll(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        return accounts.findAllById(ids).stream().map(AccountSummary::of)
                .collect(Collectors.toMap(AccountSummary::getId, Function.identity()));
    }

    @Override
    public Map<String, AccountSummary> findAllByEmail(Collection<String> emails) {
        if (emails.isEmpty()) return Map.of();
        return accounts.findAllByEmail(emails).stream().map(AccountSummary::of)
                .collect(Collectors.toMap(account -> account.getEmail().toLowerCase(Locale.ROOT), Function.identity(), (first, second) -> first));
    }

    @Override
    public AccountSummary rename(Long id, String firstName, String lastName) {
        Account account = requireAccount(id);
        if (firstName != null) account.setFirstName(required(firstName, "Le prénom"));
        if (lastName != null) account.setLastName(required(lastName, "Le nom"));
        account.setUpdatedAt(Instant.now());
        Account saved = accounts.save(account);
        events.renamed(new AccountRenamed(saved.getId(), saved.getEmail(), saved.getFirstName(), saved.getLastName()));
        return AccountSummary.of(saved);
    }

    @Override
    public void recordArrival(Long id, Arrival arrival) {
        if (arrival == null) return;
        Account account = requireAccount(id);
        account.recordArrival(arrival.path(), arrival.language(), arrival.timezone(), arrival.source());
        accounts.save(account);
    }

    private Account requireAccount(Long id) {
        return accounts.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    private static String required(String value, String label) {
        if (value.isBlank()) throw new BadRequestException(label + " ne peut pas être vide.");
        return value.trim();
    }
}
