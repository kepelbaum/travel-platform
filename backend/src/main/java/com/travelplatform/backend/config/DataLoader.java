package com.travelplatform.backend.config;

import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.repository.DestinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private DestinationRepository destinationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (destinationRepository.count() == 0) {
            loadSampleDestinations();
        }
    }

    private void loadSampleDestinations() {
        Destination paris = new Destination();
        paris.setName("Paris");
        paris.setCountry("France");
        paris.setLatitude(new BigDecimal("48.8566"));
        paris.setLongitude(new BigDecimal("2.3522"));
        paris.setDescription("The City of Light, famous for the Eiffel Tower, Louvre Museum, and romantic atmosphere.");
        destinationRepository.save(paris);

        Destination tokyo = new Destination();
        tokyo.setName("Tokyo");
        tokyo.setCountry("Japan");
        tokyo.setLatitude(new BigDecimal("35.6762"));
        tokyo.setLongitude(new BigDecimal("139.6503"));
        tokyo.setDescription("Modern metropolis blending traditional culture with cutting-edge technology.");
        destinationRepository.save(tokyo);

        Destination rome = new Destination();
        rome.setName("Rome");
        rome.setCountry("Italy");
        rome.setLatitude(new BigDecimal("41.9028"));
        rome.setLongitude(new BigDecimal("12.4964"));
        rome.setDescription("The Eternal City, home to ancient history, Vatican City, and incredible cuisine.");
        destinationRepository.save(rome);

        Destination nyc = new Destination();
        nyc.setName("New York City");
        nyc.setCountry("United States");
        nyc.setLatitude(new BigDecimal("40.7128"));
        nyc.setLongitude(new BigDecimal("-74.0060"));
        nyc.setDescription("The Big Apple - iconic skyline, Broadway shows, and cultural diversity.");
        destinationRepository.save(nyc);

        Destination barcelona = new Destination();
        barcelona.setName("Barcelona");
        barcelona.setCountry("Spain");
        barcelona.setLatitude(new BigDecimal("41.3851"));
        barcelona.setLongitude(new BigDecimal("2.1734"));
        barcelona.setDescription("Vibrant city known for Gaudi architecture, beaches, and Mediterranean culture.");
        destinationRepository.save(barcelona);

        Destination stPetersburg = new Destination();
        stPetersburg.setName("St. Petersburg");
        stPetersburg.setCountry("Russia");
        stPetersburg.setLatitude(new BigDecimal("59.9311"));
        stPetersburg.setLongitude(new BigDecimal("30.3609"));
        stPetersburg.setDescription("Russia's cultural capital featuring the magnificent Hermitage Museum, stunning palaces, and beautiful canals.");
        destinationRepository.save(stPetersburg);

        System.out.println("Loaded sample destinations data");
    }
}
