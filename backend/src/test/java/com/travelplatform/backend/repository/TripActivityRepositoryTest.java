package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class TripActivityRepositoryTest {

    @Autowired
    private TripActivityRepository tripActivityRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testFindByTripIdOrderByPlannedDateAscStartTimeAsc() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffel = new Activity("Eiffel Tower", "attraction", paris);
        Activity louvre = new Activity("Louvre", "museum", paris);
        eiffel = activityRepository.save(eiffel);
        louvre = activityRepository.save(louvre);

        TripActivity morning = new TripActivity(trip, eiffel, LocalDate.of(2026, 3, 15), LocalTime.of(9, 0), 120, "Europe/Paris");
        TripActivity afternoon = new TripActivity(trip, louvre, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 180, "Europe/Paris");
        TripActivity nextDay = new TripActivity(trip, eiffel, LocalDate.of(2026, 3, 16), LocalTime.of(10, 0), 90, "Europe/Paris");

        tripActivityRepository.save(afternoon);
        tripActivityRepository.save(nextDay);
        tripActivityRepository.save(morning);

        List<TripActivity> activities = tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(trip.getId());

        assertThat(activities).hasSize(3);
        assertThat(activities.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(activities.get(1).getStartTime()).isEqualTo(LocalTime.of(14, 0));
        assertThat(activities.get(2).getPlannedDate()).isEqualTo(LocalDate.of(2026, 3, 16));
    }

    @Test
    public void testFindByTripIdAndPlannedDateOrderByStartTimeAsc() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity = new Activity("Test Activity", "attraction", paris);
        activity = activityRepository.save(activity);

        LocalDate targetDate = LocalDate.of(2026, 3, 15);
        LocalDate otherDate = LocalDate.of(2026, 3, 16);

        TripActivity afternoon = new TripActivity(trip, activity, targetDate, LocalTime.of(14, 0), 120, "Europe/Paris");
        TripActivity morning = new TripActivity(trip, activity, targetDate, LocalTime.of(9, 0), 120, "Europe/Paris");
        TripActivity otherDay = new TripActivity(trip, activity, otherDate, LocalTime.of(10, 0), 120, "Europe/Paris");

        tripActivityRepository.save(afternoon);
        tripActivityRepository.save(morning);
        tripActivityRepository.save(otherDay);

        List<TripActivity> targetDateActivities = tripActivityRepository
                .findByTripIdAndPlannedDateOrderByStartTimeAsc(trip.getId(), targetDate);

        assertThat(targetDateActivities).hasSize(2);
        assertThat(targetDateActivities.get(0).getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(targetDateActivities.get(1).getStartTime()).isEqualTo(LocalTime.of(14, 0));
    }

    @Test
    public void testFindByTripIdAndDateRange() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Europe Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity = new Activity("Test Activity", "attraction", paris);
        activity = activityRepository.save(activity);

        TripActivity before = new TripActivity(trip, activity, LocalDate.of(2026, 3, 14), LocalTime.of(10, 0), 120, "Europe/Paris");
        TripActivity inRange1 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");
        TripActivity inRange2 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 17), LocalTime.of(10, 0), 120, "Europe/Paris");
        TripActivity after = new TripActivity(trip, activity, LocalDate.of(2026, 3, 20), LocalTime.of(10, 0), 120, "Europe/Paris");

        tripActivityRepository.save(before);
        tripActivityRepository.save(inRange1);
        tripActivityRepository.save(inRange2);
        tripActivityRepository.save(after);

        List<TripActivity> rangeActivities = tripActivityRepository.findByTripIdAndDateRange(
                trip.getId(), LocalDate.of(2026, 3, 15), LocalDate.of(2026, 3, 18));

        assertThat(rangeActivities).hasSize(2);
        assertThat(rangeActivities).extracting(TripActivity::getPlannedDate)
                .containsExactly(LocalDate.of(2026, 3, 15), LocalDate.of(2026, 3, 17));
    }

    @Test
    public void testHasTimeConflict() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity = new Activity("Test Activity", "attraction", paris);
        activity = activityRepository.save(activity);

        LocalDate testDate = LocalDate.of(2026, 3, 15);

        TripActivity existing = new TripActivity(trip, activity, testDate, LocalTime.of(10, 0), 120, "Europe/Paris");
        tripActivityRepository.save(existing);

        boolean conflict1 = tripActivityRepository.hasTimeConflict(trip.getId(), testDate, LocalTime.of(9, 0), 90);
        boolean conflict2 = tripActivityRepository.hasTimeConflict(trip.getId(), testDate, LocalTime.of(11, 0), 60);
        boolean conflict3 = tripActivityRepository.hasTimeConflict(trip.getId(), testDate, LocalTime.of(8, 0), 60);
        boolean conflict4 = tripActivityRepository.hasTimeConflict(trip.getId(), testDate, LocalTime.of(13, 0), 60);

        assertThat(conflict1).isTrue();
        assertThat(conflict2).isTrue();
        assertThat(conflict3).isFalse();
        assertThat(conflict4).isFalse();
    }

    @Test
    public void testFindConflictingActivities() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity1 = new Activity("Activity 1", "attraction", paris);
        Activity activity2 = new Activity("Activity 2", "museum", paris);
        activity1 = activityRepository.save(activity1);
        activity2 = activityRepository.save(activity2);

        LocalDate testDate = LocalDate.of(2026, 3, 15);

        TripActivity morning = new TripActivity(trip, activity1, testDate, LocalTime.of(9, 0), 120, "Europe/Paris");
        TripActivity afternoon = new TripActivity(trip, activity2, testDate, LocalTime.of(15, 0), 120, "Europe/Paris");
        tripActivityRepository.save(morning);
        tripActivityRepository.save(afternoon);

        List<TripActivity> conflicts = tripActivityRepository.findConflictingActivities(
                trip.getId(), testDate, LocalTime.of(10, 0), 180);

        assertThat(conflicts).hasSize(1);
        assertThat(conflicts.get(0).getActivity().getName()).isEqualTo("Activity 1");
    }

    @Test
    public void testExistsByTripIdAndActivityId() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity scheduled = new Activity("Scheduled Activity", "attraction", paris);
        Activity notScheduled = new Activity("Not Scheduled", "museum", paris);
        scheduled = activityRepository.save(scheduled);
        notScheduled = activityRepository.save(notScheduled);

        TripActivity tripActivity = new TripActivity(trip, scheduled, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");
        tripActivityRepository.save(tripActivity);

        boolean existsScheduled = tripActivityRepository.existsByTripIdAndActivityId(trip.getId(), scheduled.getId());
        boolean existsNotScheduled = tripActivityRepository.existsByTripIdAndActivityId(trip.getId(), notScheduled.getId());

        assertThat(existsScheduled).isTrue();
        assertThat(existsNotScheduled).isFalse();
    }

    @Test
    public void testCalculateTotalEstimatedCost() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity expensive = new Activity("Expensive Activity", "attraction", paris);
        expensive.setEstimatedCost(5000.0);
        Activity cheap = new Activity("Cheap Activity", "museum", paris);
        cheap.setEstimatedCost(1500.0);

        expensive = activityRepository.save(expensive);
        cheap = activityRepository.save(cheap);

        TripActivity tripActivity1 = new TripActivity(trip, expensive, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");
        TripActivity tripActivity2 = new TripActivity(trip, cheap, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 90, "Europe/Paris");
        tripActivityRepository.save(tripActivity1);
        tripActivityRepository.save(tripActivity2);

        Integer totalCost = tripActivityRepository.calculateTotalEstimatedCost(trip.getId());

        assertThat(totalCost).isEqualTo(6500);
    }

    @Test
    public void testCalculateTotalActualCost() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Paris Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity = new Activity("Test Activity", "attraction", paris);
        activity = activityRepository.save(activity);

        TripActivity tripActivity1 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");
        tripActivity1.setActualCost(3000);

        TripActivity tripActivity2 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 90, "Europe/Paris");
        tripActivity2.setActualCost(2000);

        TripActivity tripActivity3 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(16, 0), 60, "Europe/Paris");

        tripActivityRepository.save(tripActivity1);
        tripActivityRepository.save(tripActivity2);
        tripActivityRepository.save(tripActivity3);

        Integer totalActualCost = tripActivityRepository.calculateTotalActualCost(trip.getId());

        assertThat(totalActualCost).isEqualTo(5000);
    }

    @Test
    public void testFindDistinctPlannedDatesByTripId() {
        User user = new User("John", "john@test.com", "password");
        user = userRepository.save(user);

        Trip trip = new Trip();
        trip.setName("Multi-day Trip");
        trip.setUser(user);
        trip.setStartDate(LocalDate.of(2026, 3, 15));
        trip.setEndDate(LocalDate.of(2026, 3, 20));
        trip = tripRepository.save(trip);

        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity activity = new Activity("Test Activity", "attraction", paris);
        activity = activityRepository.save(activity);

        TripActivity day1Morning = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(9, 0), 120, "Europe/Paris");
        TripActivity day1Afternoon = new TripActivity(trip, activity, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 120, "Europe/Paris");
        TripActivity day2 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 17), LocalTime.of(10, 0), 120, "Europe/Paris");
        TripActivity day3 = new TripActivity(trip, activity, LocalDate.of(2026, 3, 16), LocalTime.of(11, 0), 120, "Europe/Paris");

        tripActivityRepository.save(day1Morning);
        tripActivityRepository.save(day1Afternoon);
        tripActivityRepository.save(day2);
        tripActivityRepository.save(day3);

        List<LocalDate> uniqueDates = tripActivityRepository.findDistinctPlannedDatesByTripId(trip.getId());

        assertThat(uniqueDates).hasSize(3);
        assertThat(uniqueDates).containsExactly(
                LocalDate.of(2026, 3, 15),
                LocalDate.of(2026, 3, 16),
                LocalDate.of(2026, 3, 17)
        );
    }
}