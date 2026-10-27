package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

public class NewsletterServiceImpl implements NewsletterService {
    private final SubscriberStore subscribers;
    private final AccountDirectory accounts;
    private final Mailer mail;

    public NewsletterServiceImpl(SubscriberStore subscribers, AccountDirectory accounts, Mailer mail) {
        this.subscribers = subscribers;
        this.accounts = accounts;
        this.mail = mail;
    }

    @Override
    public Subscriber view(String email) {
        AccountSummary account = accounts.require(email);
        return subscribers.findByEmail(account.getEmail()).orElseGet(() -> Subscriber.builder()
                .accountId(account.getId()).email(account.getEmail())
                .status(SubscriptionStatus.UNSUBSCRIBED).subscribedAt(null).build());
    }

    @Override
    public Subscriber subscribe(String email) {
        AccountSummary account = accounts.require(email);
        Subscriber subscriber = forAccount(account);
        subscriber.subscribe();
        return subscribers.save(subscriber);
    }

    @Override
    public Subscriber subscribePublic(String email, String firstName, String lastName) {
        String address = email.trim().toLowerCase();
        if (accounts.find(address).isPresent()) {
            throw new BadRequestException("Cette adresse email est déjà associée à un compte. Connecte-toi pour gérer ton abonnement.");
        }
        Subscriber subscriber = subscribers.findByEmail(address).orElseGet(() -> Subscriber.of(address, firstName, lastName));
        if (subscriber.isSubscribed()) return subscriber;
        subscriber.awaitConfirmation();
        Subscriber saved = subscribers.save(subscriber);
        mail.send(new NewsletterConfirmation(saved.getEmail(), saved.getToken()));
        return saved;
    }

    @Override
    public void confirm(String token) {
        Subscriber subscriber = subscribers.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Ce lien de confirmation n’est plus valide."));
        subscriber.confirm();
        subscribers.save(subscriber);
    }

    @Override
    public Subscriber unsubscribe(String email) {
        Subscriber subscriber = subscribers.findByEmail(accounts.require(email).getEmail())
                .orElseThrow(() -> new NotFoundException("Aucun abonnement newsletter trouvé."));
        subscriber.unsubscribe();
        return subscribers.save(subscriber);
    }

    @Override
    public void unsubscribeByToken(String token) {
        Subscriber subscriber = subscribers.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Ce lien de désabonnement n’est plus valide."));
        subscriber.unsubscribe();
        subscribers.save(subscriber);
    }

    @Override
    public void attachAccount(Long accountId, String email, String firstName, String lastName, boolean wantsNewsletter) {
        Subscriber subscriber = subscribers.findByEmail(email).orElse(null);
        if (subscriber == null && !wantsNewsletter) return;
        if (subscriber == null) subscriber = Subscriber.of(email, firstName, lastName);
        subscriber.setAccountId(accountId);
        if (wantsNewsletter) subscriber.subscribe();
        subscribers.save(subscriber);
    }

    @Override
    public void renameSubscriber(String email, String firstName, String lastName) {
        subscribers.findByEmail(email).ifPresent(subscriber -> {
            subscriber.rename(firstName, lastName);
            subscribers.save(subscriber);
        });
    }

    private Subscriber forAccount(AccountSummary account) {
        Subscriber subscriber = subscribers.findByEmail(account.getEmail())
                .orElseGet(() -> Subscriber.of(account.getEmail(), account.getFirstName(), account.getLastName()));
        subscriber.setAccountId(account.getId());
        return subscriber;
    }
}
