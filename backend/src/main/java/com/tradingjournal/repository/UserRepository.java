package com.tradingjournal.repository;

import com.tradingjournal.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // Standard — used when email is already normalised (lowercase)
    Optional<User> findByEmail(String email);

    // Case-insensitive — handles legacy data with capital letters
    // Use this everywhere to be safe
    @Query("{ 'email': { $regex: ?0, $options: 'i' } }")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    // Case-insensitive exists check
    @Query(value = "{ 'email': { $regex: ?0, $options: 'i' } }", exists = true)
    boolean existsByEmailIgnoreCase(String email);
}