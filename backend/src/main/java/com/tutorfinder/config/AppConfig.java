package com.tutorfinder.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    // UserDetailsService is provided by UserDetailsServiceImpl (@Service)
    // Do NOT define a second UserDetailsService bean here —
    // having two causes Spring to pick the wrong one, breaking @AuthenticationPrincipal
    // and login after registration.

    @Bean
    public ModelMapper modelMapper() { return new ModelMapper(); }
}
