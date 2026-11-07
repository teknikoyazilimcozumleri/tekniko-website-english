---
title: "Mapping GİB UBL-TR 1.2 to Peppol BIS Billing 3.0: A Developer's Translation Guide"
description: An e-invoice from Turkey's GİB needs to be translated into Peppol BIS Billing 3.0 for cross-border B2B transactions. This guide explains how developers can do that.
image: /xml_coverpage.png
tags: ["B2B", "EU", "Türkiye", "Peppol", "E-Invoicing", "UBL", "XML", "XSLT"]
lang: en
slug: ubltr_to_peppol
---

Turkish exporters operate under the Turkish Revenue Administration's (GİB) electronic invoice clearance framework, which requires XML file schemas formatted according to a localized UBL-TR 1.2 specification. If that exporter tries to forward this XML directly to a European trading partner or to a Peppol Access Point, it will be rejected immediately.

The EU uses the EN 16931-1 standard and the Peppol BIS Billing 3.0 specification. These follow strict validation layers:

- **Schema Validation**: OASIS UBL 2.1 syntax compliance
- **CEN Business Rules** (Using a schematron): Core mathematical and relational integrity checks
- **OpenPeppol Extensions**: Transport-specific constraints

---

## Schema Discrepancies

There are a few schema discrepancies that need to be updated:

## 1. Specification/Process Identifiers

In GİB UBL-TR, <cbc:CustomizationID> is used for customization and <cbc:ProfileID> usually defaults to **TEMELFATURA** or **TICARIFATURA**

However, when sending invoices over the Peppol network, Peppol BIS 3.0 requires strict values for these fields:

```
<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
```

## 2. Party Legal Entities & Endpoint Addressing

GİB uses either Turkish National ID Numbers (TCKN) or Tax Identification Numbers (VKN) for part identification field <cac:PartyIdentification>

Peppol requires an electronic endpoint identifier (BT-34 for Seller, BT-49 for Buyer) with an explicit ISO 6523 schemeID attribute (validated under rule PEPPOL-EN16931-CL008). For example, Belgian entities use 0208, German Leitweg-IDs use 0204, and European organizations frequently use GS1 GLN numbers (0088). For example:

```
<cac:AccountingCustomerParty>
  <cac:Party>
    <cbc:EndpointID schemeID="0208">0447000188</cbc:EndpointID>
    <cac:PartyIdentification>
      <cbc:ID schemeID="0088">5412345000013</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>EU Buyer Logistics BV</cbc:RegistrationName>
      <cbc:CompanyID schemeID="0208">0447000188</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party>
</cac:AccountingCustomerParty>
```

## 3. UNTDID 5305 Category Mapping

GİB invoices use domestic tax type codes (such as 0015 for KDV) and exempt cross-border supply using standard text notes (such as 301 for Mal İhracatı).

Meanwhile, Peppol enforces the UNTDID 5305 European standard, which has single-character duty/tax categories:

- **S**: Standard rate (requires populated **<cbc:Percent>** and **<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>**)
- **AE**: Reverse Charge (for Intra-Community cross-border services)
- **G**: export outside the EU (must include VATEX-EU-G exemption code according to rule PEPPOL-EN16931-P0104)
- **K**: Intra-Community supply of goods (must include exemption code VATEX-EU-IC according to rule PEPPOL-EN16931-P0106)

We can perform this transformation using Extensible Stylesheet Language Transformations (XSLT):

--- 

*transform.xslt*:
```
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:param name="customerScheme" select="'0208'"/>

    <!-- Stream-copy everything untouched by default -->
    <xsl:template match="@* | node()">
        <xsl:copy>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- Target & Replace Specification URNs -->
    <xsl:template match="cbc:CustomizationID">
        <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    </xsl:template>

    <xsl:template match="cbc:ProfileID">
        <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    </xsl:template>

    <!-- Inject Missing EndpointID into cac:Party if missing -->
    <xsl:template match="cac:AccountingCustomerParty/cac:Party[not(cbc:EndpointID)]">
        <xsl:copy>
            <cbc:EndpointID schemeID="{$customerScheme}">
                <xsl:value-of select="(cac:PartyIdentification/cbc:ID | cac:PartyLegalEntity/cbc:CompanyID)[1]"/>
            </cbc:EndpointID>
            <xsl:apply-templates select="@* | node()"/>
        </xsl:copy>
    </xsl:template>

    <!-- Prune Empty Elements -->
    <xsl:template match="*[not(*) and not(normalize-space()) and not(@*)]"/>

</xsl:stylesheet>
```

--- 

*main.py*:
```python
from lxml import etree

# TODO: compile style sheets when you start your app or API
xslt_tree = etree.parse("transform.xslt")
transform = etree.XSLT(xslt_tree)

def process_invoice(xml_bytes: bytes, scheme_id: str = "0208") -> bytes:
    source_document = etree.fromstring(xml_bytes)
    
    # Executes transform; parameters passed safely as XPath string expressions
    result_tree = transform(
        source_document, 
        customerScheme=etree.XSLT.strparam(scheme_id)
    )
    
    return etree.tostring(result_tree, xml_declaration=True, encoding="UTF-8")
```