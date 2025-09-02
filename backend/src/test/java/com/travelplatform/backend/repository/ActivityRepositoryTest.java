package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class ActivityRepositoryTest {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Test
    public void testFindByDestinationId() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffelTower = new Activity("Eiffel Tower", "tourist_attraction", paris);
        Activity louvre = new Activity("Louvre Museum", "museum", paris);
        activityRepository.save(eiffelTower);
        activityRepository.save(louvre);

        List<Activity> activities = activityRepository.findByDestinationId(paris.getId());

        assertThat(activities).hasSize(2);
        assertThat(activities).extracting(Activity::getName)
                .containsExactlyInAnyOrder("Eiffel Tower", "Louvre Museum");
    }

    @Test
    public void testFindByDestinationIdAndCategory() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffelTower = new Activity("Eiffel Tower", "tourist_attraction", paris);
        Activity louvre = new Activity("Louvre Museum", "museum", paris);
        Activity restaurant = new Activity("Le Comptoir", "restaurant", paris);
        activityRepository.save(eiffelTower);
        activityRepository.save(louvre);
        activityRepository.save(restaurant);

        List<Activity> museums = activityRepository.findByDestinationIdAndCategory(paris.getId(), "museum");

        assertThat(museums).hasSize(1);
        assertThat(museums.get(0).getName()).isEqualTo("Louvre Museum");
    }

    @Test
    public void testFindByPlaceId() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffelTower = Activity.createFromGooglePlaces("ChIJLU7jZClu5kcR4PcOOO6p3I0",
                "Eiffel Tower", "tourist_attraction", paris);
        activityRepository.save(eiffelTower);

        Optional<Activity> found = activityRepository.findByPlaceId("ChIJLU7jZClu5kcR4PcOOO6p3I0");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Eiffel Tower");
        assertThat(found.get().getIsCustom()).isFalse();
    }

    @Test
    public void testExistsByPlaceId() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffelTower = Activity.createFromGooglePlaces("ChIJLU7jZClu5kcR4PcOOO6p3I0",
                "Eiffel Tower", "tourist_attraction", paris);
        activityRepository.save(eiffelTower);

        assertThat(activityRepository.existsByPlaceId("ChIJLU7jZClu5kcR4PcOOO6p3I0")).isTrue();
        assertThat(activityRepository.existsByPlaceId("nonexistent-place-id")).isFalse();
    }

    @Test
    public void testFindCustomActivities() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity customActivity = Activity.createCustomActivity("Pack luggage", "custom", paris);
        Activity googleActivity = Activity.createFromGooglePlaces("place123", "Eiffel Tower", "tourist_attraction", paris);
        activityRepository.save(customActivity);
        activityRepository.save(googleActivity);

        List<Activity> customActivities = activityRepository.findByDestinationIdAndIsCustomTrue(paris.getId());
        List<Activity> googleActivities = activityRepository.findByDestinationIdAndIsCustomFalse(paris.getId());

        assertThat(customActivities).hasSize(1);
        assertThat(customActivities.get(0).getName()).isEqualTo("Pack luggage");
        assertThat(googleActivities).hasSize(1);
        assertThat(googleActivities.get(0).getName()).isEqualTo("Eiffel Tower");
    }

    @Test
    public void testFindTopRatedByDestination() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity lowRated = new Activity("Low Rated Place", "restaurant", paris);
        lowRated.setRating(new BigDecimal("3.2"));

        Activity highRated = new Activity("High Rated Place", "restaurant", paris);
        highRated.setRating(new BigDecimal("4.8"));

        Activity noRating = new Activity("No Rating Place", "restaurant", paris);

        activityRepository.save(lowRated);
        activityRepository.save(highRated);
        activityRepository.save(noRating);

        List<Activity> topRated = activityRepository.findTopRatedByDestination(paris.getId());

        assertThat(topRated).hasSize(2); // Only activities with ratings
        assertThat(topRated.get(0).getName()).isEqualTo("High Rated Place"); // Highest first
        assertThat(topRated.get(1).getName()).isEqualTo("Low Rated Place");
    }

    @Test
    public void testFindByDestinationAndCostRange() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity free = new Activity("Free Museum", "museum", paris);
        free.setEstimatedCost(0.0);

        Activity cheap = new Activity("Cheap Cafe", "restaurant", paris);
        cheap.setEstimatedCost(1500.0); // 15 euros

        Activity expensive = new Activity("Expensive Restaurant", "restaurant", paris);
        expensive.setEstimatedCost(8000.0); // 80 euros

        activityRepository.save(free);
        activityRepository.save(cheap);
        activityRepository.save(expensive);

        List<Activity> budgetActivities = activityRepository.findByDestinationAndCostRange(
                paris.getId(), 0, 2000); // 0-20 euros

        assertThat(budgetActivities).hasSize(2);
        assertThat(budgetActivities).extracting(Activity::getName)
                .containsExactlyInAnyOrder("Free Museum", "Cheap Cafe");
    }

    @Test
    public void testSearchByDestinationAndTerm() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Activity eiffelTower = new Activity("Eiffel Tower", "tourist_attraction", paris);
        eiffelTower.setDescription("Famous iron tower");

        Activity arcDeTriomphe = new Activity("Arc de Triomphe", "tourist_attraction", paris);
        arcDeTriomphe.setDescription("Historic monument");

        Activity louvre = new Activity("Louvre Museum", "museum", paris);
        louvre.setDescription("World famous art museum");

        activityRepository.save(eiffelTower);
        activityRepository.save(arcDeTriomphe);
        activityRepository.save(louvre);

        List<Activity> towerResults = activityRepository.searchByDestinationAndTerm(paris.getId(), "tower");
        List<Activity> famousResults = activityRepository.searchByDestinationAndTerm(paris.getId(), "famous");

        assertThat(towerResults).hasSize(1);
        assertThat(towerResults.get(0).getName()).isEqualTo("Eiffel Tower");

        assertThat(famousResults).hasSize(2); // Eiffel Tower and Louvre
        assertThat(famousResults).extracting(Activity::getName)
                .containsExactlyInAnyOrder("Eiffel Tower", "Louvre Museum");
    }

    @Test
    public void testCountByDestinationId() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris = destinationRepository.save(paris);

        Destination london = new Destination();
        london.setName("London");
        london.setCountry("UK");
        london = destinationRepository.save(london);

        activityRepository.save(new Activity("Eiffel Tower", "attraction", paris));
        activityRepository.save(new Activity("Louvre", "museum", paris));
        activityRepository.save(new Activity("Big Ben", "attraction", london));

        assertThat(activityRepository.countByDestinationId(paris.getId())).isEqualTo(2);
        assertThat(activityRepository.countByDestinationId(london.getId())).isEqualTo(1);
    }
}

