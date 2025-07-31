package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testFindByEmail() {
        User user = new User("John Doe", "john@example.com", "password123");
        userRepository.save(user);

        Optional<User> found = userRepository.findByEmail("john@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("John Doe");
    }

    @Test
    public void testExistsByEmail() {
        User user = new User("Jane Doe", "jane@example.com", "password123");
        userRepository.save(user);

        assertThat(userRepository.existsByEmail("jane@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("nonexistent@example.com")).isFalse();
    }
}
