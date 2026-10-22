package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserSearch;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
class JpaUserStore implements UserStore {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

    private final UserJpaRepository users;

    JpaUserStore(UserJpaRepository users) {
        this.users = users;
    }

    @Override
    public Optional<User> findById(Long id) {
        return users.findById(id).map(UserEntityMapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email).map(UserEntityMapper::toDomain);
    }

    @Override
    public List<User> findAllById(Collection<Long> ids) {
        return users.findAllById(ids).stream().map(UserEntityMapper::toDomain).toList();
    }

    @Override
    public Paged<User> search(UserSearch search, PageQuery page) {
        Page<UserEntity> found = users.findAll(UserSpecifications.matching(search),
                PageRequest.of(page.page(), page.size(), NEWEST_FIRST));
        return new Paged<>(found.getContent().stream().map(UserEntityMapper::toDomain).toList(),
                page.page(), page.size(), found.getTotalElements());
    }

    @Override
    public List<User> searchAll(UserSearch search) {
        return users.findAll(UserSpecifications.matching(search), NEWEST_FIRST).stream()
                .map(UserEntityMapper::toDomain).toList();
    }

    @Override
    public User save(User user) {
        // Loaded rather than rebuilt: inside the caller's transaction the row is usually already in
        // the persistence context, and only the changed columns are written.
        UserEntity entity = user.getId() == null ? new UserEntity() : existing(user.getId());
        UserEntityMapper.copy(user, entity);
        return UserEntityMapper.toDomain(users.save(entity));
    }

    private UserEntity existing(Long id) {
        return users.findById(id).orElseThrow(() -> new IllegalStateException("No user " + id + " to update"));
    }

    @Override
    public void delete(Long id) {
        users.deleteById(id);
    }
}
