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
        paris.setImageUrl("https://plus.unsplash.com/premium_photo-1661919210043-fd847a58522d?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        paris.setLatitude(new BigDecimal("48.8566"));
        paris.setLongitude(new BigDecimal("2.3522"));
        paris.setDescription("The City of Light, famous for the Eiffel Tower, Louvre Museum, and romantic atmosphere.");
        destinationRepository.save(paris);

        Destination tokyo = new Destination();
        tokyo.setName("Tokyo");
        tokyo.setCountry("Japan");
        tokyo.setImageUrl("https://plus.unsplash.com/premium_photo-1661914240950-b0124f20a5c1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        tokyo.setLatitude(new BigDecimal("35.6762"));
        tokyo.setLongitude(new BigDecimal("139.6503"));
        tokyo.setDescription("Modern metropolis blending traditional culture with cutting-edge technology.");
        destinationRepository.save(tokyo);

        Destination rome = new Destination();
        rome.setName("Rome");
        rome.setCountry("Italy");
        rome.setImageUrl("https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=796&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        rome.setLatitude(new BigDecimal("41.9028"));
        rome.setLongitude(new BigDecimal("12.4964"));
        rome.setDescription("The Eternal City, home to ancient history, Vatican City, and incredible cuisine.");
        destinationRepository.save(rome);

        Destination nyc = new Destination();
        nyc.setName("New York");
        nyc.setCountry("United States");
        nyc.setImageUrl("https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg");
        nyc.setLatitude(new BigDecimal("40.7128"));
        nyc.setLongitude(new BigDecimal("-74.0060"));
        nyc.setDescription("The Big Apple - iconic skyline, Broadway shows, and cultural diversity.");
        destinationRepository.save(nyc);

        Destination barcelona = new Destination();
        barcelona.setName("Barcelona");
        barcelona.setCountry("Spain");
        barcelona.setImageUrl("https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?q=80&w=465&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        barcelona.setLatitude(new BigDecimal("41.3851"));
        barcelona.setLongitude(new BigDecimal("2.1734"));
        barcelona.setDescription("Vibrant city known for Gaudi architecture, beaches, and Mediterranean culture.");
        destinationRepository.save(barcelona);

        Destination stPetersburg = new Destination();
        stPetersburg.setName("St. Petersburg");
        stPetersburg.setCountry("Russia");
        stPetersburg.setImageUrl("https://images.unsplash.com/photo-1653123997230-53d933c99fcb?q=80&w=386&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        stPetersburg.setLatitude(new BigDecimal("59.9311"));
        stPetersburg.setLongitude(new BigDecimal("30.3609"));
        stPetersburg.setDescription("Russia's cultural capital featuring the magnificent Hermitage Museum, stunning palaces, and beautiful canals.");
        destinationRepository.save(stPetersburg);

        Destination hongKong = new Destination();
        hongKong.setName("Hong Kong");
        hongKong.setCountry("China");
        hongKong.setImageUrl("https://media.istockphoto.com/id/629604122/photo/cityscape-hong-kong-and-junkboat-at-twilight.jpg?s=612x612&w=0&k=20&c=iQGOvCiYdXQW-k6_uUJfvYXpJiSmQj-WCOXXOpXy1iE=");
        hongKong.setLatitude(new BigDecimal("22.3193"));
        hongKong.setLongitude(new BigDecimal("114.1694"));
        hongKong.setDescription("International financial hub with stunning skyline, dim sum cuisine, and unique East-meets-West culture.");
        destinationRepository.save(hongKong);

        Destination singapore = new Destination();
        singapore.setName("Singapore");
        singapore.setCountry("Singapore");
        singapore.setImageUrl("https://upload.wikimedia.org/wikipedia/commons/2/2e/Singapore_Skyline_2019-10.jpg");
        singapore.setLatitude(new BigDecimal("1.3521"));
        singapore.setLongitude(new BigDecimal("103.8198"));
        singapore.setDescription("Modern city-state known for Marina Bay Sands, Gardens by the Bay, and incredible street food.");
        destinationRepository.save(singapore);

        Destination prague = new Destination();
        prague.setName("Prague");
        prague.setCountry("Czech Republic");
        prague.setImageUrl("https://www.amazingczechia.com/wp-content/uploads/2017/06/prague-orloj-01.jpg");
        prague.setLatitude(new BigDecimal("50.0755"));
        prague.setLongitude(new BigDecimal("14.4378"));
        prague.setDescription("Beautiful medieval city with Gothic architecture, Prague Castle, and rich history.");
        destinationRepository.save(prague);

        System.out.println("Loaded sample destinations data");
    }
}
