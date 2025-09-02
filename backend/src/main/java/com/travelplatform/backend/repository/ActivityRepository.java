package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId AND a.rating IS NOT NULL ORDER BY a.rating DESC")
    List<Activity> findTopRatedByDestination(@Param("destinationId") Long destinationId);

    // Find activities within price range
    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId AND " +
            "(:minCost IS NULL OR a.estimatedCost >= :minCost) AND " +
            "(:maxCost IS NULL OR a.estimatedCost <= :maxCost)")
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

    // Find activities by city
    @Query("SELECT a FROM Activity a WHERE LOWER(a.destination.name) = LOWER(:cityName)")
    List<Activity> findByCityNameIgnoreCase(@Param("cityName") String cityName);

    // Get all unique categories for filtering
    @Query("SELECT DISTINCT a.category FROM Activity a WHERE a.category IS NOT NULL")
    List<String> findDistinctCategories();

    Optional<Activity> findByDestinationIdAndNameIgnoreCase(Long destinationId, String name);

    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId " +
            "ORDER BY " +
            "(CASE " +
            "  WHEN a.rating IS NOT NULL AND a.userRatingsTotal > 100 THEN a.rating * LOG10(a.userRatingsTotal) * 10 " +
            "  WHEN a.rating IS NOT NULL AND a.userRatingsTotal > 10 THEN a.rating * LOG10(a.userRatingsTotal) * 5 " +
            "  WHEN a.rating IS NOT NULL THEN a.rating * 2 " +
            "  ELSE 0 " +
            "END) DESC, " +
            "a.name ASC")
    Page<Activity> findByDestinationIdOrderByPopularity(
            @Param("destinationId") Long destinationId,
            Pageable pageable);

    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId " +
            "AND a.category = :category " +
            "ORDER BY " +
            "(CASE " +
            "  WHEN a.rating IS NOT NULL AND a.userRatingsTotal > 100 THEN a.rating * LOG10(a.userRatingsTotal) * 10 " +
            "  WHEN a.rating IS NOT NULL AND a.userRatingsTotal > 10 THEN a.rating * LOG10(a.userRatingsTotal) * 5 " +
            "  WHEN a.rating IS NOT NULL THEN a.rating * 2 " +
            "  ELSE 0 " +
            "END) DESC, " +
            "a.name ASC")
    Page<Activity> findByDestinationIdAndCategoryOrderByPopularity(
            @Param("destinationId") Long destinationId,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT a FROM Activity a WHERE a.destination.id = :destinationId " +
            "AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(a.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY " +
            "CASE WHEN a.rating IS NOT NULL THEN a.rating ELSE 0 END DESC")
    Page<Activity> searchByDestinationAndTermPaginated(
            @Param("destinationId") Long destinationId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);
}