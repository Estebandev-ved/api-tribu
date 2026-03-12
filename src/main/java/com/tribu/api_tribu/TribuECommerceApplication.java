package com.tribu.api_tribu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TribuECommerceApplication {

	public static void main(String[] args) {
		SpringApplication.run(TribuECommerceApplication.class, args);
	}

}
