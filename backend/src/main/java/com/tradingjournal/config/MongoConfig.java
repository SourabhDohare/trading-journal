package com.tradingjournal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.math.BigDecimal;
import java.util.Arrays;

@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(Arrays.asList(
                new BigDecimalToStringConverter(),
                new StringToBigDecimalConverter()
        ));
    }

    // Store BigDecimal as String in MongoDB (consistent serialization)
    @WritingConverter
    static class BigDecimalToStringConverter implements Converter<BigDecimal, String> {
        @Override
        public String convert(BigDecimal source) {
            return source.toPlainString();
        }
    }

    // Read String back as BigDecimal
    @ReadingConverter
    static class StringToBigDecimalConverter implements Converter<String, BigDecimal> {
        @Override
        public BigDecimal convert(String source) {
            try {
                return new BigDecimal(source);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
    }
}