package com.travelplatform.backend.service;

import com.travelplatform.backend.dto.AuthResponse;
import com.travelplatform.backend.dto.LoginRequest;
import com.travelplatform.backend.dto.RegisterRequest;
import com.travelplatform.backend.dto.UserDto;
import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.TripActivity;
import com.travelplatform.backend.entity.User;
import com.travelplatform.backend.exception.InvalidCredentialsException;
import com.travelplatform.backend.exception.UserAlreadyExistsException;
import com.travelplatform.backend.repository.TripActivityRepository;
import com.travelplatform.backend.repository.TripRepository;
import com.travelplatform.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripActivityRepository tripActivityRepository;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        return new AuthResponse(new UserDto(savedUser), jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        return new AuthResponse(new UserDto(user), jwtToken);
    }

    @Transactional
    public void deleteUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Get all user's trips using existing method (if it exists)
        List<Trip> userTrips = tripRepository.findAll().stream()
                .filter(trip -> trip.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        // Delete trip activities for each trip
        for (Trip trip : userTrips) {
            List<TripActivity> tripActivities = tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(trip.getId());
            tripActivityRepository.deleteAll(tripActivities);
        }

        // Delete trips
        tripRepository.deleteAll(userTrips);

        // Finally delete user
        userRepository.delete(user);
    }
}