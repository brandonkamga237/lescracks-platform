package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.member.domain.model.AvatarImages;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

public class ProfileServiceImpl implements ProfileService {
    private static final Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);

    private final AccountDirectory accounts;
    private final MemberProfileStore profiles;
    private final StorageService storage;
    private final TaxonomyService taxonomy;

    public ProfileServiceImpl(AccountDirectory accounts, MemberProfileStore profiles, StorageService storage,
                              TaxonomyService taxonomy) {
        this.accounts = accounts;
        this.profiles = profiles;
        this.storage = storage;
        this.taxonomy = taxonomy;
    }

    @Override
    public MemberView view(String email) {
        AccountSummary account = accounts.require(email);
        return new MemberView(account, profileOf(account.getId()));
    }

    @Override
    public MemberView update(String email, ProfileChanges changes) {
        AccountSummary account = accounts.require(email);
        if (changes.firstName() != null || changes.lastName() != null) {
            account = accounts.rename(account.getId(), changes.firstName(), changes.lastName());
        }
        MemberProfile profile = profileOf(account.getId());
        if (changes.username() != null) profile.setUsername(optional(changes.username().toLowerCase()));
        if (changes.bio() != null) profile.setBio(optional(changes.bio()));
        if (changes.location() != null) profile.setLocation(optional(changes.location()));
        if (changes.socialLinks() != null) profile.setSocialLinks(changes.socialLinks());
        profile.changePhone(changes.phone());
        if (changes.situation() != null) profile.setSituation(changes.situation());
        if (changes.goal() != null) profile.setGoal(changes.goal());
        interests(profile, changes.interestIds());
        if (changes.marketingConsent() != null) profile.setMarketingConsent(changes.marketingConsent());
        ProfileVisibility visibility = changes.visibility();
        if (visibility != null) {
            if (visibility.bio() != null) profile.setPublicBio(visibility.bio());
            if (visibility.location() != null) profile.setPublicLocation(visibility.location());
            if (visibility.links() != null) profile.setPublicLinks(visibility.links());
        }
        return new MemberView(account, touchAndSave(profile));
    }

    @Override
    public MemberView onboard(String email, OnboardingAnswers answers) {
        AccountSummary account = accounts.require(email);
        MemberProfile profile = profileOf(account.getId());
        profile.changePhone(answers.phone());
        if (answers.situation() != null) profile.setSituation(answers.situation());
        if (answers.goal() != null) profile.setGoal(answers.goal());
        interests(profile, answers.interestIds());
        if (answers.location() != null && !answers.location().isBlank()) profile.setLocation(answers.location().trim());
        if (answers.marketingConsent() != null) profile.setMarketingConsent(answers.marketingConsent());
        profile.markOnboarded();
        accounts.recordArrival(account.getId(), answers.arrival());
        return new MemberView(account, touchAndSave(profile));
    }

    @Override
    public MemberView updateAvatar(String email, String fileName, byte[] content) {
        String contentType = AvatarImages.check(content);
        AccountSummary account = accounts.require(email);
        MemberProfile profile = profileOf(account.getId());
        String previous = profile.getAvatarUrl();
        profile.setAvatarUrl(storage.store(fileName, content, contentType));
        MemberProfile saved = touchAndSave(profile);
        discard(previous);
        return new MemberView(account, saved);
    }

    @Override
    public MemberView removeAvatar(String email) {
        AccountSummary account = accounts.require(email);
        MemberProfile profile = profileOf(account.getId());
        discard(profile.getAvatarUrl());
        profile.setAvatarUrl(null);
        return new MemberView(account, touchAndSave(profile));
    }

    @Override
    public void recordSignUp(Long accountId, String phone, Boolean marketingConsent) {
        MemberProfile profile = profileOf(accountId);
        profile.changePhone(phone);
        if (marketingConsent != null) profile.setMarketingConsent(marketingConsent);
        touchAndSave(profile);
    }

    private MemberProfile profileOf(Long accountId) {
        return profiles.find(accountId).orElseGet(() -> MemberProfile.empty(accountId));
    }

    private MemberProfile touchAndSave(MemberProfile profile) {
        profile.setUpdatedAt(Instant.now());
        return profiles.save(profile);
    }

    private static String optional(String value) {
        return value.isBlank() ? null : value.trim();
    }

    /** Null leaves them as they are; each id must be an existing category. */
    private void interests(MemberProfile profile, Set<Long> ids) {
        if (ids == null) return;
        Set<Long> checked = new HashSet<>();
        for (Long id : ids) {
            checked.add(taxonomy.requireCategory(id).getId());
        }
        profile.setInterests(checked);
    }

    /** Deletes a photo we stored; an external URL is not ours to delete, and a failed cleanup never fails the change. */
    private void discard(String avatar) {
        if (avatar == null || avatar.isBlank() || avatar.startsWith("http") || avatar.startsWith("/")) return;
        try {
            storage.delete(avatar);
        } catch (RuntimeException cause) {
            log.warn("Previous avatar {} not deleted: {}", avatar, cause.getMessage());
        }
    }
}
