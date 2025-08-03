package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByDestinationId(Long destinationId);

    List<Activity> findByDestinationIdAndCategory(Long destinationId, String category);

    Optional<Activity> findByPlaceId(String placeId);

    boolean existsByPlaceId(String placeId);

    List<Activity> findByDestinationIdAndIsCustomTrue(Long destinationId);

    List<Activity> findByDestinationIdAndIsCustomFalse(Long destinationId);

    List<Activity> findByCategory(String category);

    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId AND a.rating IS NOT NULL ORDER BY a.rating DESC")
    List<Activity> findTopRatedByDestination(@Param("destinationId") Long destinationId);

    // Find activities within price range
    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId AND " +
            "(:minCost IS NULL OR a.costEstimate >= :minCost) AND " +
            "(:maxCost IS NULL OR a.costEstimate <= :maxCost)")
    List<Activity> findByDestinationAndCostRange(
            @Param("destinationId") Long destinationId,
            @Param("minCost") Integer minCost,
            @Param("maxCost") Integer maxCost
    );

    // Search activities by name or description
    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId AND " +
            "(LOWER(a.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(a.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Activity> searchByDestinationAndTerm(
            @Param("destinationId") Long destinationId,
            @Param("searchTerm") String searchTerm
    );

    long countByDestinationId(Long destinationId);

    long countByDestinationIdAndCategory(Long destinationId, String category);
}