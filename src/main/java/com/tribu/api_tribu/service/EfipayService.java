package com.tribu.api_tribu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class EfipayService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${efipay.api.url}")
    private String apiUrl;

    @Value("${efipay.api.key}")
    private String apiKey;

    @Value("${efipay.office.id}")
    private String officeId;

    @Value("${efipay.commerce.id}")
    private String commerceId;

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        String token = apiKey != null ? apiKey : "";
        int len = token.length();
        String prefix = len > 12 ? token.substring(0, 12) : token;
        String suffix = len > 6 ? token.substring(len - 6) : token;
        log.info("Efipay auth - len={}, prefix='{}', suffix='{}' (commerce_id={}, office={})",
                len, prefix, suffix, commerceId, officeId);
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    public EfipayPaymentResponse generatePayment(
            String referenceId,
            double amount,
            String description,
            String webhookUrl,
            String approvedUrl,
            String rejectedUrl,
            String pendingUrl
    ) {
        try {
            ObjectNode body = objectMapper.createObjectNode();

            ObjectNode payment = objectMapper.createObjectNode();
            payment.put("description", description);
            payment.put("amount", amount);
            payment.put("currency_type", "COP");
            payment.put("checkout_type", "redirect");
            body.set("payment", payment);

            ObjectNode advancedOptions = objectMapper.createObjectNode();

            ArrayNode references = objectMapper.createArrayNode();
            references.add(referenceId);
            advancedOptions.set("references", references);

            ObjectNode resultUrls = objectMapper.createObjectNode();
            resultUrls.put("approved", approvedUrl);
            resultUrls.put("rejected", rejectedUrl);
            resultUrls.put("pending", pendingUrl);
            resultUrls.put("webhook", webhookUrl);
            advancedOptions.set("result_urls", resultUrls);

            body.set("advanced_options", advancedOptions);
            body.put("office", Integer.parseInt(officeId));

            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), createHeaders());

            log.info("Generating efipay payment for ref {}: amount={}, office={}", referenceId, amount, officeId);
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    apiUrl + "/payment/generate-payment",
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode data = response.getBody();
                boolean saved = data.get("saved").asBoolean();
                if (saved) {
                    String paymentId = data.get("payment_id").asText();
                    String checkoutUrl = data.get("url").asText();
                    log.info("Efipay payment generated: paymentId={}, url={}", paymentId, checkoutUrl);
                    return new EfipayPaymentResponse(paymentId, checkoutUrl);
                }
            }

            log.error("Efipay generate payment failed: {}", response.getBody());
            return null;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Error generating efipay payment for ref {} (Status: {}): {} | Response Body: {}", 
                    referenceId, e.getStatusCode(), e.getMessage(), e.getResponseBodyAsString(), e);
            return null;
        } catch (Exception e) {
            log.error("Error generating efipay payment for ref {}: {}", referenceId, e.getMessage(), e);
            return null;
        }
    }

    public record EfipayPaymentResponse(String paymentId, String checkoutUrl) {}
}
