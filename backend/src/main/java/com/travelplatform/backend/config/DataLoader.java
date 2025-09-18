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
        if (destinationRepository.count() < 9) {
            loadSampleDestinations();
        }
    }

    private void loadSampleDestinations() {
//        Destination paris = new Destination();
//        paris.setName("Paris");
//        paris.setCountry("France");
//        paris.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrzVPI3qDctbHnm93x3G10xssc-cTBI4c1gV4t38Z3sy7LNoCWLcnaOGFqX3utJEFoi24XEkRekIXkrQ1QvJbExdyxtoYD8rcRFdSKQX48uTw0Hfh0InuBuslY56Ijv86dAph_EL5K-rY4=w408-h544-k-no");
//        paris.setLatitude(new BigDecimal("48.8566"));
//        paris.setLongitude(new BigDecimal("2.3522"));
//        paris.setDescription("The City of Light, famous for the Eiffel Tower, Louvre Museum, and romantic atmosphere.");
//        destinationRepository.save(paris);
//
//        Destination tokyo = new Destination();
//        tokyo.setName("Tokyo");
//        tokyo.setCountry("Japan");
//        tokyo.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4nr-A74Lt53TH8t4PLJJJ-sDWdxvwr4i4E6AbWW3PBOLr3JG_2wgY-MPmf0dkAbz6nfFVZNHzIBuQbVFw9RxVINuLf1yj3B2Gu-6lLlxC3w8oqsGxYQ0i1IQmXmesFqkD-pvm_EWMw=w408-h272-k-no");
//        tokyo.setLatitude(new BigDecimal("35.6762"));
//        tokyo.setLongitude(new BigDecimal("139.6503"));
//        tokyo.setDescription("Modern metropolis blending traditional culture with cutting-edge technology.");
//        destinationRepository.save(tokyo);
//
//        Destination rome = new Destination();
//        rome.setName("Rome");
//        rome.setCountry("Italy");
//        rome.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrvKgIa6-2rWXGI8mTxPpy3VLuuSoP87SSLclB2lMlG8fE69Fk5x7p8OMZ79ZQAwTKe7WzcsL85YUWeY46HxZ4jedLhz5V5gRtnpud0dob2g2_fr989vJ61h1w06NS__9vWGwJSHw=w408-h306-k-no");
//        rome.setLatitude(new BigDecimal("41.9028"));
//        rome.setLongitude(new BigDecimal("12.4964"));
//        rome.setDescription("The Eternal City, home to ancient history, Vatican City, and incredible cuisine.");
//        destinationRepository.save(rome);
//
//        Destination nyc = new Destination();
//        nyc.setName("New York");
//        nyc.setCountry("United States");
//        nyc.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4npKnOWRUbg51lzFAlJORZ2Tmu8Xw42RNoGfxvPB-QCR2RJCbNc97drlwLD4YCNdRQ1zVmGK_uImmA7C-WUV25hKrYKZO7okIbH6XVnsiBVlJ4NWU-l_UvzoNQZAAUGd0frNDvTDRg=w408-h270-k-no");
//        nyc.setLatitude(new BigDecimal("40.7128"));
//        nyc.setLongitude(new BigDecimal("-74.0060"));
//        nyc.setDescription("The Big Apple - iconic skyline, Broadway shows, and cultural diversity.");
//        destinationRepository.save(nyc);
//
//        Destination barcelona = new Destination();
//        barcelona.setName("Barcelona");
//        barcelona.setCountry("Spain");
//        barcelona.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4npebvfuj9HTie6HjJRpCq8WIJwFGihKVkarChzpJfttiMsnwlrnSRStgy6xKahMZxaqc8dYNzUowmVPaOBXFWr0uaAG4FYkuvGGhpThrHppHTJ9Qpg-QCzd1oQXoglrOM_cs6en=w408-h272-k-no");
//        barcelona.setLatitude(new BigDecimal("41.3851"));
//        barcelona.setLongitude(new BigDecimal("2.1734"));
//        barcelona.setDescription("Vibrant city known for Gaudi architecture, beaches, and Mediterranean culture.");
//        destinationRepository.save(barcelona);
//
//        Destination stPetersburg = new Destination();
//        stPetersburg.setName("St. Petersburg");
//        stPetersburg.setCountry("Russia");
//        stPetersburg.setImageUrl("https://lh3.googleusercontent.com/gps-cs-s/AC9h4noSbJzKUCUTknnOXz1EJJKlOSL6jsxLEwQYFVNj74vFGl57ueBo08u92g3FkvMRwlsSs0NE19O2HjBhvUfdgXSB58p0jOEH7qbYl6Hs5mvPyE9JyKI0Vd8ihorlwetYd6n_73RK=w408-h306-k-no");
//        stPetersburg.setLatitude(new BigDecimal("59.9311"));
//        stPetersburg.setLongitude(new BigDecimal("30.3609"));
//        stPetersburg.setDescription("Russia's cultural capital featuring the magnificent Hermitage Museum, stunning palaces, and beautiful canals.");
//        destinationRepository.save(stPetersburg);

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
