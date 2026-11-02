---
title: "Preparing SaaS Platforms for France and Germany’s Mandates"
description: What France and Germany’s e-invoicing deadlines mean for multi-tenant SaaS billing.
image: /compliance_stamp.png
tags: ["SaaS", "B2B", "EU", "Compliance", "E-Invoicing", "Peppol", "XRechnung", "ZUGFeRD", "France", "Germany"]
lang: en
slug: preparing_saas_france_germany
---

If you run a B2B/B2G platform in Europe, your billing engine is likely designed such that when a subscription renews, the system charges a credit card and emails a PDF invoice. In 2026 and 2027, for thousands of your European customers, that PDF will become legally invalid; specific formats will be used.

European tax authorities are shifting from post-audit paper trails to real-time, structured digital reporting. To maintain compliance without bottlenecking your core application, engineering teams must re-architect their billing pipelines from synchronous PDF generators into asynchronous, EN 16931-compliant XML engines that are able to work with the PDF formats required by government agencies. 


## The Regulatory Timelines Forcing the Shift

European tenants are facing strict deadlines to overhaul how they issue and receive invoices; some deadlines have already passed. Your platform must support these changes:

- France: The mandate for B2B e-invoicing and e-reporting rolls out starting September 1, 2026, making issuance mandatory for large and mid-tier enterprises (ETIs). Small and micro-enterprises follow exactly one year later on September 1, 2027. All domestic invoices must pass through accredited partner platforms (Plateformes Agréées) or the public billing portal (PPF).

- Germany: While all German businesses have been legally required to receive EN 16931-compliant e-invoices since January 1, 2025, mandatory issuance begins on January 1, 2027. This 2027 deadline applies to businesses whose 2026 turnover exceeded €800,000. Accepted formats include XRechnung and hybrid formats like ZUGFeRD.


## The Core Problem

Standard billing APIs (like Stripe or Chargebee) are excellent at payment collection but were not built for localized tax compliance reporting. E-invoicing mandates dictate that invoices must be issued in structured, machine-readable formats (typically XML based on the European EN 16931 standard). This standard specifies 176 distinct business terms, including detailed tax breakdowns, line items, and seller/buyer routing identifiers.

In a multi-tenant SaaS environment, you cannot hardcode these rules. Tenant A (a German manufacturing company) requires XRechnung routing via a Leitweg-ID, while Tenant B (a French marketing firm) requires UBL formatting routed through a specific Plateforme Agréée using a SIRET number.


## The Architecture Blueprint: Decoupling Billing from Compliance

Attempting to generate EN 16931 XML synchronously during the checkout or renewal request will introduce unacceptable latency and risk failing the entire transaction if a government endpoint times out. The solution is an Asynchronous E-Invoicing Queue Worker. A sample data flow using a microservice:

![Sample data flow using a microservice](/compliance_data_flow.jpeg)


## Step 1: Upgrading the Tenant Master Data
Before you can generate a compliant invoice, your database must capture endpoint identifiers. You must update your tenant onboarding flows to capture:

- Company Identifiers: French SIRET, German VAT IDs.

- Routing IDs: Leitweg-ID for German B2G, or the Peppol Endpoint ID.

- Tax Categorization: Granular mapping of your product catalog to specific VAT category codes (e.g., standard rate, reverse charge).

## Step 2: XML Transformation
When a billing event occurs, the worker picks up the JSON payload and translates it. European mandates rely on the EN 16931 core model.

Real Schema Excerpt (UBL 2.1 mapping for EN 16931): Instead of a simple "Tax: €21.00" string on a PDF, your engine must generate a structured <cac:TaxTotal> array that strictly defines the tax subtotal, the taxable amount, and the specific VAT category.

```
<!-- Tax Breakdown Example in UBL -->
<cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">100.00</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
        <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21.00</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:TaxCategory>
    </cac:TaxSubtotal>
</cac:TaxTotal>

<!-- Electronic Routing Identification Example -->
<cac:AccountingCustomerParty>
    <cac:Party>
        <cbc:EndpointID schemeID="0208">0447000188</cbc:EndpointID>
    </cac:Party>
</cac:AccountingCustomerParty>
```

## Step 3: Dispatch and Reconciliation
Because government portals and Access Points often validate files asynchronously, your microservice must handle delayed rejections. If the French PPF rejects an invoice because of a malformed SIRET, your webhook consumer must parse that rejection, map the error code, and surface an actionable alert in the tenant's UI without requiring engineering intervention.


## Conclusion
Preparing a SaaS platform for the 2026/2027 European invoicing mandates requires deep adjustments to data models and queue architectures. If your engineering team is currently relying on flat PDFs and needs help architecting an EN 16931-compliant XML pipeline, [**<u>book a 30-minute technical architecture call</u>**](https://www.teknikosoftwaresolutions.com/#contact) with our integration engineers to scope out your custom translation layer.