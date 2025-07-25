package com.travelplatform.backend.service;

import com.travelplatform.backend.dto.AuthResponse;
import com.travelplatform.backend.dto.LoginRequest;
import com.travelplatform.backend.dto.RegisterRequest;
import com.travelplatform.backend.dto.UserDto;
import com.travelplatform.backend.entity.User;
import com.travelplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        String token = "placeholder-" + savedUser.getId();

        return new AuthResponse(new UserDto(savedUser), token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = "placeholder-" + user.getId();

        return new AuthResponse(new UserDto(user), token);
    }
}
