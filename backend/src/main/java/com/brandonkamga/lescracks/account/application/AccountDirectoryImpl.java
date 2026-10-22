package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class AccountDirectoryImpl implements AccountDirectory {
    private final AccountStore accounts;

    public AccountDirectoryImpl(AccountStore accounts) {
        this.accounts = accounts;
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
    public AccountSummary createContact(String email, String firstName, String lastName) {
        return AccountSummary.of(accounts.save(Account.builder()
                .email(email.trim().toLowerCase())
                .firstName(firstName == null ? "" : firstName.trim())
                .lastName(lastName == null ? "" : lastName.trim())
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .provider(AuthProvider.LOCAL)
                .build()));
    }

    @Override
    public AccountSummary rename(Long id, String firstName, String lastName) {
        Account account = requireAccount(id);
        if (firstName != null) account.setFirstName(required(firstName, "Le prénom"));
        if (lastName != null) account.setLastName(required(lastName, "Le nom"));
        account.setUpdatedAt(Instant.now());
        return AccountSummary.of(accounts.save(account));
    }

    @Override
    public void recordArrival(Long id, Arrival arrival) {
        if (arrival == null) return;
        Account account = requireAccount(id);
        account.recordArrival(arrival.path(), arrival.language(), arrival.timezone());
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
