"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  Share2,
  Check,
  Printer,
  ChevronRight,
  ArrowUp,
  ArrowRight,
  Scale
} from 'lucide-react';

type ContentItem =
  | { type: 'paragraph'; text: string }
  | { type: 'definitions'; items: { term: string; desc: string }[] }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'subheading'; title: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'flowchart'; steps: string[] }
  | { type: 'contactCard'; company: string; location: string; email: string; website: string };

interface Section {
  id: string;
  number: string;
  title: string;
  category: string;
  content: ContentItem[];
}

const termsData: Section[] = [
  {
    "id": "preamble",
    "number": "0",
    "title": "PREAMBLE & AGREEMENT TO TERMS",
    "category": "General",
    "content": [
      {
        "type": "paragraph",
        "text": "In these Terms and Conditions (“Terms”), any use of the words “you”, “yours”, “Customer” or similar expressions shall mean any business, organisation or legal entity that purchases, subscribes to, accesses or uses the Xentra software platform. Terms such as “we”, “us”, “our” or “DORT Asia” shall mean DORT Asia."
      },
      {
        "type": "paragraph",
        "text": "These Terms govern access to and use of the Xentra software platform and related services provided by DORT Asia. By creating an account, purchasing a subscription, accessing, or using Xentra, the customer organisation agrees to be bound by these Terms."
      },
      {
        "type": "paragraph",
        "text": "If you are accepting these Terms on behalf of an organisation, you represent and warrant that you have the authority to bind that organisation to these Terms."
      }
    ]
  },
  {
    "id": "definitions",
    "number": "1",
    "title": "1. DEFINITIONS",
    "category": "Introduction",
    "content": [
      {
        "type": "paragraph",
        "text": "For the purposes of these Terms:"
      },
      {
        "type": "definitions",
        "items": [
          {
            "term": "“Xentra”",
            "desc": "means the cloud-based HRMS and workforce management platform provided by DORT Asia, including its web application, mobile application, features, modules, APIs, documentation and related services made available from time to time."
          },
          {
            "term": "“Customer”",
            "desc": "means the business, organisation or legal entity that purchases or subscribes to Xentra."
          },
          {
            "term": "“Authorised User”",
            "desc": "means an individual authorised by the Customer to access or use Xentra under the Customer’s account."
          },
          {
            "term": "“Customer Data”",
            "desc": "means information, records, documents, files and other data submitted, uploaded, created or otherwise provided by or on behalf of the Customer through Xentra."
          },
          {
            "term": "“Subscription”",
            "desc": "means the paid subscription selected by the Customer for access to Xentra."
          },
          {
            "term": "“Subscription Period”",
            "desc": "means the applicable monthly or annual billing period for a Subscription."
          },
          {
            "term": "“Subscription Fees”",
            "desc": "means the fees payable by the Customer for the selected Subscription."
          },
          {
            "term": "“Third-Party Services”",
            "desc": "means services, platforms, applications or integrations provided by third parties and connected to or used with Xentra."
          }
        ]
      }
    ]
  },
  {
    "id": "about-xentra",
    "number": "2",
    "title": "2. ABOUT XENTRA",
    "category": "Introduction",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is a cloud-based HRMS designed to help businesses manage workforce information and related operational processes, including:"
      },
      {
        "type": "list",
        "items": [
          "Employee management",
          "Employee records",
          "Attendance",
          "Leave management",
          "Payroll workflows",
          "Workforce administration",
          "Documents",
          "Work-pass information",
          "Reporting and analytics",
          "Employee self-service",
          "Compliance-related workflows",
          "Other modules and features made available under the applicable Subscription"
        ]
      },
      {
        "type": "paragraph",
        "text": "Xentra is designed to connect employee information with related workforce operations. Individual features and modules may vary depending on the Subscription selected by the Customer."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia may introduce, modify, improve, replace or discontinue features from time to time, subject to these Terms and any applicable contractual commitments."
      }
    ]
  },
  {
    "id": "eligibility-and-authority",
    "number": "3",
    "title": "3. ELIGIBILITY AND AUTHORITY",
    "category": "Introduction",
    "content": [
      {
        "type": "paragraph",
        "text": "You may use Xentra only if:"
      },
      {
        "type": "numbered",
        "items": [
          "You are legally capable of entering into a binding agreement;",
          "You are authorised to enter into these Terms on behalf of the Customer, where applicable;",
          "The information provided during registration or subscription is accurate and complete; and",
          "You use Xentra for legitimate business and lawful purposes."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Customer is responsible for ensuring that its Authorised Users are properly authorised to access the platform."
      }
    ]
  },
  {
    "id": "account-registration-and-security",
    "number": "4",
    "title": "4. ACCOUNT REGISTRATION AND SECURITY",
    "category": "Introduction",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer is responsible for:"
      },
      {
        "type": "list",
        "items": [
          "Providing accurate account and company information;",
          "Maintaining the confidentiality of account credentials;",
          "Assigning appropriate roles and permissions;",
          "Ensuring that Authorised Users use their own accounts where required;",
          "Preventing unauthorised access;",
          "Promptly removing or disabling access for users who are no longer authorised; and",
          "Notifying DORT Asia of any suspected unauthorised access or security incident affecting the Customer’s account."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Customer must not share administrative credentials or knowingly allow unauthorised individuals to access Xentra."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia may take reasonable measures to protect the security of the platform and may restrict or suspend access where necessary to address a security risk."
      }
    ]
  },
  {
    "id": "subscription-plans",
    "number": "5",
    "title": "5. SUBSCRIPTION PLANS",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is provided on a subscription basis. The Customer may select an available:"
      },
      {
        "type": "list",
        "items": [
          "Monthly Subscription; or",
          "Annual Subscription."
        ]
      },
      {
        "type": "paragraph",
        "text": "The features, employee limits, module availability, usage limits and other entitlements applicable to the Customer will depend on the selected plan and the commercial terms presented at the time of purchase."
      },
      {
        "type": "paragraph",
        "text": "Subscription details displayed during checkout or otherwise agreed with the Customer form part of the applicable commercial arrangement."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia may introduce additional plans, modules, features or usage limits from time to time."
      }
    ]
  },
  {
    "id": "add-on-services-and-packs",
    "number": "6",
    "title": "6. ADD-ON SERVICES AND PACKS",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "In addition to the Subscription plans, Xentra may offer optional paid add-on services and packs. Add-ons provide additional capacity, functionality, storage, branches, customization requests or other features beyond the Customer’s base Subscription."
      },
      {
        "type": "paragraph",
        "text": "Add-ons may include, without limitation:"
      },
      {
        "type": "list",
        "items": [
          "Employee Packs, including additional employee capacity;",
          "Storage Packs, including additional storage capacity;",
          "Branch Packs, including additional branches;",
          "Customization Packs, including a defined number of customization requests per billing period; and",
          "Feature Add-Ons, including OCR Employee Onboarding, AI Assistant, API Access, White Label and other optional functionality made available by DORT Asia."
        ]
      },
      {
        "type": "paragraph",
        "text": "Add-ons are subject to the availability, eligibility, limits and pricing displayed by DORT Asia at the time of purchase. Current add-on pricing may be published separately on the Xentra pricing page, checkout page or applicable order confirmation and may be updated in accordance with these Terms."
      },
      {
        "type": "paragraph",
        "text": "Add-ons may be purchased in addition to an eligible base Subscription. An annual base Subscription does not prevent the Customer from purchasing an add-on on a monthly recurring billing cycle where that add-on is offered on such terms."
      },
      {
        "type": "paragraph",
        "text": "Quantity-based add-ons, including employee, storage and branch packs, may be stacked. For example, two +10 Employee Packs provide an additional capacity of +20 employees, subject to the applicable plan and system limits."
      },
      {
        "type": "paragraph",
        "text": "Add-ons that provide functionality rather than capacity, such as AI Assistant, API Access, OCR Employee Onboarding or White Label, are treated as separate recurring add-on services and are not treated as stackable quantity packs unless expressly stated otherwise."
      },
      {
        "type": "paragraph",
        "text": "Customization requests are tied to the applicable add-on billing period. Unused customization requests do not carry forward to a subsequent billing period unless DORT Asia expressly agrees otherwise."
      },
      {
        "type": "paragraph",
        "text": "Unless otherwise stated at checkout or in the applicable commercial terms, the billing, automatic renewal, cancellation, refund, upgrade, downgrade, failed-payment, tax and price-change provisions of these Terms apply to Add-On Services and Packs in the same manner as they apply to the base Subscription."
      },
      {
        "type": "paragraph",
        "text": "An add-on may be activated immediately following successful purchase, subject to payment confirmation and technical availability. Where applicable, Stripe or the relevant payment provider may calculate prorated charges for an add-on activated during an existing billing period."
      },
      {
        "type": "paragraph",
        "text": "Removal or downgrade of an add-on will generally take effect at the end of the current paid add-on billing period, unless otherwise stated at checkout or agreed in writing. The Customer remains entitled to use the add-on until the applicable paid period ends, subject to these Terms."
      }
    ]
  },
  {
    "id": "subscription-fees",
    "number": "7",
    "title": "7. SUBSCRIPTION FEES",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "Subscription Fees are charged according to the Subscription selected by the Customer."
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise:"
      },
      {
        "type": "list",
        "items": [
          "Prices displayed by DORT Asia are exclusive of applicable GST;",
          "Applicable GST and other legally required taxes may be added during checkout or invoicing;",
          "Subscription Fees must be paid using the payment method supported by the applicable checkout process;",
          "Subscription Fees are payable in advance for the applicable Subscription Period; and",
          "Subscription Fees are generally non-refundable."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Customer is responsible for providing accurate billing and payment information."
      }
    ]
  },
  {
    "id": "automatic-renewal",
    "number": "8",
    "title": "8. AUTOMATIC RENEWAL",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "Monthly and annual Subscriptions automatically renew unless cancelled before the applicable renewal date."
      },
      {
        "type": "callout",
        "title": "Renewal Cadence",
        "text": "A monthly Subscription automatically renews every month for another monthly Subscription Period. An annual Subscription automatically renews every twelve (12) months for another annual Subscription Period. The Customer authorises DORT Asia and its payment provider to charge the applicable renewal Subscription Fees."
      },
      {
        "type": "paragraph",
        "text": "The Customer may cancel the Subscription before the next renewal date. Cancellation prevents the next renewal but does not ordinarily terminate the already-paid Subscription Period."
      }
    ]
  },
  {
    "id": "cancellation",
    "number": "9",
    "title": "9. CANCELLATION",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer may cancel its Subscription through the cancellation mechanism made available by DORT Asia or, where applicable, by contacting DORT Asia through the designated support channel."
      },
      {
        "type": "paragraph",
        "text": "Cancellation:"
      },
      {
        "type": "numbered",
        "items": [
          "Stops future automatic renewal;",
          "Does not ordinarily result in an immediate termination of access;",
          "Allows the Customer to continue using the applicable Subscription until the end of the current paid Subscription Period; and",
          "Does not automatically entitle the Customer to a refund for the unused portion of the current Subscription Period."
        ]
      },
      {
        "type": "callout",
        "title": "Cancellation Example",
        "text": "If a monthly Subscription is paid for the period from 1 August to 31 August and the Customer cancels on 15 August, the Subscription will normally remain active until 31 August and will not renew on 1 September. There is no separate cancellation grace period."
      }
    ]
  },
  {
    "id": "refunds",
    "number": "10",
    "title": "10. REFUNDS",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "Subscription Fees are generally non-refundable. Cancellation does not automatically create a right to a refund for the remaining portion of a paid Subscription Period."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia may, at its discretion, provide a refund or credit in exceptional circumstances. Examples may include:"
      },
      {
        "type": "list",
        "items": [
          "Duplicate charges;",
          "Incorrect charges;",
          "Billing errors;",
          "Technical billing issues; or",
          "Other circumstances determined by DORT Asia."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where a refund is considered following termination by DORT Asia for serious misuse, fraud, material breach or other prohibited conduct, any refund will be determined by DORT Asia on a case-by-case basis, taking into account the circumstances of the termination and applicable law."
      },
      {
        "type": "paragraph",
        "text": "Any refund relating to payment processing may also be subject to limitations imposed by the applicable payment provider."
      }
    ]
  },
  {
    "id": "upgrades-and-downgrades",
    "number": "11",
    "title": "11. UPGRADES AND DOWNGRADES",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "subheading",
        "title": "11.1 Upgrades"
      },
      {
        "type": "paragraph",
        "text": "Where the Customer upgrades to a higher Subscription: the upgrade may take effect immediately, additional charges may be calculated on a prorated basis for the remaining portion of the current Subscription Period, and Stripe or the applicable payment provider may process the prorated charge."
      },
      {
        "type": "subheading",
        "title": "11.2 Downgrades"
      },
      {
        "type": "paragraph",
        "text": "Where the Customer downgrades to a lower Subscription: the downgrade will generally take effect at the next renewal, the existing Subscription remains active until the end of the current paid period, and the Customer remains responsible for fees for the current period."
      }
    ]
  },
  {
    "id": "failed-payments",
    "number": "12",
    "title": "12. FAILED PAYMENTS",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "If a renewal payment fails, DORT Asia may use the payment provider’s available retry mechanisms. The Customer may receive notifications regarding the failed payment and may be required to update its payment method."
      },
      {
        "type": "flowchart",
        "steps": [
          "Payment Failure",
          "Payment-Provider Retry",
          "Payment Warning",
          "Restricted Access",
          "Account Suspension"
        ]
      },
      {
        "type": "paragraph",
        "text": "DORT Asia is not required to provide a separate payment grace period. If payment remains unsuccessful, DORT Asia may restrict or suspend access to paid features or the Xentra account. Suspension for non-payment does not automatically mean that Customer Data is immediately deleted."
      }
    ]
  },
  {
    "id": "taxes-and-gst",
    "number": "13",
    "title": "13. TAXES AND GST",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "All applicable taxes, including Singapore GST where applicable, may be charged in addition to the advertised Subscription Fees unless expressly stated otherwise."
      },
      {
        "type": "paragraph",
        "text": "The Customer is responsible for paying all taxes applicable to its purchase or use of Xentra, except taxes imposed on DORT Asia’s income. Where required, DORT Asia may issue applicable invoices or tax documentation."
      }
    ]
  },
  {
    "id": "price-changes",
    "number": "14",
    "title": "14. PRICE CHANGES",
    "category": "Plans & Billing",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may change Subscription Fees, plan structures, feature entitlements or usage limits from time to time."
      },
      {
        "type": "callout",
        "title": "60-Day Advance Notice Guarantee",
        "text": "For existing paid Subscriptions, DORT Asia will provide at least sixty (60) days’ notice before a price increase takes effect, unless a shorter period is required or permitted by applicable law or the change relates solely to applicable taxes or government-imposed charges."
      },
      {
        "type": "paragraph",
        "text": "Unless otherwise stated, a price change will generally apply from the Customer’s next applicable renewal following the effective date of the change. If the Customer does not agree to a future price increase, the Customer may cancel the Subscription before the applicable renewal date."
      }
    ]
  },
  {
    "id": "customer-data",
    "number": "15",
    "title": "15. CUSTOMER DATA",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer retains its rights, title and interest in Customer Data, subject to applicable law and the rights of individuals whose personal data is contained within Customer Data."
      },
      {
        "type": "paragraph",
        "text": "Customer Data may include: Employee information, Employment records, Attendance records, Leave records, Payroll information, Compensation information, Employee documents, Work-pass information, Bank/payment information, and Company information."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia does not acquire ownership of Customer Data merely because the Customer uses Xentra. The Customer grants DORT Asia the limited rights necessary to host, store, process, transmit, display and handle Customer Data solely for providing, securing and improving Xentra services."
      }
    ]
  },
  {
    "id": "customer-responsibilities-for-data",
    "number": "16",
    "title": "16. CUSTOMER RESPONSIBILITIES FOR DATA",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer is responsible for:"
      },
      {
        "type": "numbered",
        "items": [
          "The accuracy and completeness of Customer Data;",
          "Ensuring that Customer Data is collected and used lawfully;",
          "Providing required notices to employees and other individuals;",
          "Obtaining any required permissions, consents or other lawful basis for processing;",
          "Configuring HR, attendance, leave and payroll policies correctly;",
          "Reviewing payroll and statutory outputs before relying on them;",
          "Complying with employment, tax, payroll and other applicable legal obligations;",
          "Maintaining appropriate access permissions;",
          "Protecting user credentials;",
          "Removing access for unauthorised users; and",
          "Using Xentra only for lawful business purposes."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Customer must not use Xentra as a substitute for its own legal, tax, employment or professional responsibilities."
      }
    ]
  },
  {
    "id": "hr-payroll-and-compliance-disclaimer",
    "number": "17",
    "title": "17. HR, PAYROLL AND COMPLIANCE DISCLAIMER",
    "category": "Compliance & Legal",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra provides software tools and workflows intended to support HR, payroll, workforce administration and compliance-related activities. Xentra does not provide legal, tax, accounting, employment or professional advice."
      },
      {
        "type": "paragraph",
        "text": "The availability of a compliance-related feature does not constitute a guarantee that the Customer is legally or statutorily compliant. The Customer remains responsible for verifying applicable laws, statutory rates/thresholds, payroll calculations, eligibility requirements, filing submissions, and employment decisions."
      },
      {
        "type": "paragraph",
        "text": "Singapore-oriented features may include workflows relating to CPF, MOM-related records, work passes, Foreign Worker Levy (FWL) and IRAS-related payroll information where such functionality is available. Applicable government requirements may change; Customer must verify before relying."
      }
    ]
  },
  {
    "id": "payroll-responsibility",
    "number": "18",
    "title": "18. PAYROLL RESPONSIBILITY",
    "category": "Compliance & Legal",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra may provide payroll calculation, preparation, reporting or related workflow functionality depending on the applicable Subscription."
      },
      {
        "type": "paragraph",
        "text": "The Customer remains responsible for reviewing payroll information before finalisation, payment or statutory submission. DORT Asia is not responsible for losses arising solely from incorrect Customer Data, configuration errors, attendance inputs, incorrect statutory settings, or Customer failure to review outputs."
      }
    ]
  },
  {
    "id": "third-party-services",
    "number": "19",
    "title": "19. THIRD-PARTY SERVICES",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra may use or integrate with third-party services, including payment providers, communication services, analytics, and hosting infrastructure."
      },
      {
        "type": "callout",
        "title": "Payment Processing & Stripe",
        "text": "Subscription payments and billing-related processing are handled through Stripe. Stripe may process payment and billing information in accordance with its own terms and policies. DORT Asia does not store full payment-card credentials where processed directly by Stripe."
      },
      {
        "type": "paragraph",
        "text": "DORT Asia is not responsible for failures, interruptions, delays, changes or limitations caused solely by a third-party service, except to the extent otherwise required by applicable law."
      }
    ]
  },
  {
    "id": "integrations",
    "number": "20",
    "title": "20. INTEGRATIONS",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "Where integrations are enabled, the Customer authorises the transfer or exchange of relevant information necessary to provide the integration."
      },
      {
        "type": "paragraph",
        "text": "The Customer is responsible for authorising integrations, configuring permissions, maintaining valid credentials, ensuring lawful use, and reviewing transferred data. DORT Asia may disable an integration where it presents a security or operational risk."
      }
    ]
  },
  {
    "id": "intellectual-property",
    "number": "21",
    "title": "21. INTELLECTUAL PROPERTY",
    "category": "IP & Guidelines",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra and all related intellectual property are owned by or licensed to DORT Asia and its licensors, including software, source code, application architecture, user interface, design elements, branding, workflows, and database structures."
      },
      {
        "type": "paragraph",
        "text": "Subject to these Terms and payment of applicable fees, DORT Asia grants the Customer a limited, non-exclusive, non-transferable and non-sublicensable right to access and use Xentra during the Subscription Period."
      },
      {
        "type": "paragraph",
        "text": "The Customer must not copy, resell, reverse engineer, remove proprietary notices, reproduce the interface design, or use Xentra to build a competing platform."
      }
    ]
  },
  {
    "id": "customer-content-and-feedback",
    "number": "22",
    "title": "22. CUSTOMER CONTENT AND FEEDBACK",
    "category": "IP & Guidelines",
    "content": [
      {
        "type": "paragraph",
        "text": "If the Customer provides suggestions, recommendations, ideas or feedback regarding Xentra, DORT Asia may use such feedback to improve the product without owing compensation to the Customer, provided confidential information is not disclosed."
      }
    ]
  },
  {
    "id": "confidentiality",
    "number": "23",
    "title": "23. CONFIDENTIALITY",
    "category": "IP & Guidelines",
    "content": [
      {
        "type": "paragraph",
        "text": "Each party agrees to use confidential information only for the purposes of the relationship, protect it using reasonable safeguards, and not disclose it to unauthorised third parties except where required by law."
      }
    ]
  },
  {
    "id": "privacy-and-personal-data",
    "number": "24",
    "title": "24. PRIVACY AND PERSONAL DATA",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "The processing of personal data is governed by DORT Asia’s applicable Privacy Policy and, where applicable, a separate Data Processing Addendum (DPA)."
      },
      {
        "type": "paragraph",
        "text": "The Customer remains responsible for ensuring lawful collection and submission of personal data. DORT Asia implements reasonable technical and organisational security measures aligned with Singapore PDPA standards."
      }
    ]
  },
  {
    "id": "security",
    "number": "25",
    "title": "25. SECURITY",
    "category": "Data & Privacy",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia maintains reasonable security measures, including authentication controls, role-based access control, tenant/company data isolation, database access controls, encryption in transit and at rest, audit logging, and automated backup/recovery mechanisms."
      }
    ]
  },
  {
    "id": "service-availability-and-maintenance",
    "number": "26",
    "title": "26. SERVICE AVAILABILITY AND MAINTENANCE",
    "category": "Operations",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia will use reasonable efforts to maintain Xentra as an operational cloud service. However, uninterrupted or error-free availability is not guaranteed unless expressly provided under a separate SLA."
      }
    ]
  },
  {
    "id": "prohibited-use",
    "number": "27",
    "title": "27. PROHIBITED USE",
    "category": "Operations",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer and Authorised Users must not use Xentra to violate laws, commit fraud, upload malware, attempt unauthorised access, circumvent security controls, conduct unauthorised penetration testing, or reverse engineer systems."
      }
    ]
  },
  {
    "id": "suspension",
    "number": "28",
    "title": "28. SUSPENSION",
    "category": "Termination",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may temporarily restrict or suspend access for non-payment, security concerns, suspected fraud, material breach, or legal requirements. Suspension does not release accrued payment obligations."
      }
    ]
  },
  {
    "id": "termination-by-the-customer",
    "number": "29",
    "title": "29. TERMINATION BY THE CUSTOMER",
    "category": "Termination",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer may terminate its Subscription by cancelling it in accordance with Section 9. Upon termination or expiry, access to paid features ends at the period end, future renewals stop, and outstanding amounts remain payable."
      }
    ]
  },
  {
    "id": "termination-by-dort-asia",
    "number": "30",
    "title": "30. TERMINATION BY DORT ASIA",
    "category": "Termination",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may terminate or suspend access if the Customer materially breaches these Terms, fails to pay Subscription Fees, engages in fraud, creates a material security risk, or if continued provision becomes unlawful."
      }
    ]
  },
  {
    "id": "customer-data-after-termination",
    "number": "31",
    "title": "31. CUSTOMER DATA AFTER TERMINATION",
    "category": "Termination",
    "content": [
      {
        "type": "paragraph",
        "text": "Following termination or expiry, the Customer may request an export of its Customer Data during the retrieval window made available by DORT Asia. After the retention period, Customer Data may be deleted or anonymised subject to legal requirements."
      }
    ]
  },
  {
    "id": "no-professional-or-legal-advice",
    "number": "32",
    "title": "32. NO PROFESSIONAL OR LEGAL ADVICE",
    "category": "Legal & Liability",
    "content": [
      {
        "type": "paragraph",
        "text": "Xentra is a software platform. Nothing provided through Xentra constitutes legal, employment, tax, accounting, payroll consultancy, immigration, or financial advice."
      }
    ]
  },
  {
    "id": "disclaimer-of-warranties",
    "number": "33",
    "title": "33. DISCLAIMER OF WARRANTIES",
    "category": "Legal & Liability",
    "content": [
      {
        "type": "paragraph",
        "text": "To the maximum extent permitted by applicable law, Xentra is provided on an “as available” and “as is” basis without warranties of uninterrupted or error-free operation."
      }
    ]
  },
  {
    "id": "limitation-of-liability",
    "number": "34",
    "title": "34. LIMITATION OF LIABILITY",
    "category": "Legal & Liability",
    "content": [
      {
        "type": "paragraph",
        "text": "To the maximum extent permitted by applicable law, DORT Asia will not be liable for indirect, incidental, special, or consequential losses, or for loss of profits, revenue, or business opportunity."
      },
      {
        "type": "callout",
        "title": "12-Month Aggregate Liability Cap",
        "text": "Subject to applicable law, DORT Asia’s aggregate liability arising from or relating to Xentra will be limited to the Subscription Fees actually paid by the Customer to DORT Asia during the twelve (12) months immediately preceding the event giving rise to the claim."
      }
    ]
  },
  {
    "id": "indemnity",
    "number": "35",
    "title": "35. INDEMNITY",
    "category": "Legal & Liability",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer agrees to indemnify and hold harmless DORT Asia from claims, losses, and damages arising from unlawful use of Xentra, infringing Customer Data, breach of Terms, or Customer employment decisions."
      }
    ]
  },
  {
    "id": "force-majeure",
    "number": "36",
    "title": "36. FORCE MAJEURE",
    "category": "Legal & Liability",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia will not be responsible for delay or failure to perform obligations where resulting from circumstances beyond reasonable control, including natural disasters, pandemics, internet infrastructure failures, or government action."
      }
    ]
  },
  {
    "id": "changes-to-xentra",
    "number": "37",
    "title": "37. CHANGES TO XENTRA",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may modify, update, improve or discontinue features of Xentra from time to time. Where a change materially reduces core paid functionality, reasonable notice will be provided where practicable."
      }
    ]
  },
  {
    "id": "changes-to-these-terms",
    "number": "38",
    "title": "38. CHANGES TO THESE TERMS",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may update these Terms from time to time by publishing updated terms on the website or platform. Continued use after the effective date constitutes acceptance."
      }
    ]
  },
  {
    "id": "notices",
    "number": "39",
    "title": "39. NOTICES",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "DORT Asia may provide notices relating to Xentra or these Terms through the Xentra application, email, account notifications, or the official website."
      }
    ]
  },
  {
    "id": "assignment",
    "number": "40",
    "title": "40. ASSIGNMENT",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "The Customer may not assign rights or obligations without prior written consent. DORT Asia may assign Terms as part of a merger, acquisition, corporate restructuring, or asset sale."
      }
    ]
  },
  {
    "id": "severability",
    "number": "41",
    "title": "41. SEVERABILITY",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "If any provision is determined to be invalid or unenforceable, it will be modified to the minimum extent necessary to make it enforceable, and remaining provisions will continue in full force."
      }
    ]
  },
  {
    "id": "entire-agreement",
    "number": "42",
    "title": "42. ENTIRE AGREEMENT",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "These Terms, together with applicable order confirmations, pricing pages, Privacy Policy, DPA, and Acceptable Use Policy, constitute the entire agreement between the parties concerning Xentra."
      }
    ]
  },
  {
    "id": "no-waiver",
    "number": "43",
    "title": "43. NO WAIVER",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "A failure or delay by DORT Asia to enforce any provision does not constitute a waiver of its right to enforce that provision later."
      }
    ]
  },
  {
    "id": "governing-law",
    "number": "44",
    "title": "44. GOVERNING LAW",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "These Terms and the relationship between DORT Asia and the Customer are governed exclusively by the laws of the Republic of Singapore, without regard to conflict-of-law principles."
      }
    ]
  },
  {
    "id": "dispute-resolution-and-jurisdiction",
    "number": "45",
    "title": "45. DISPUTE RESOLUTION AND JURISDICTION",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "The parties will first attempt to resolve any dispute through good-faith discussions. If unresolved, disputes will be subject to the exclusive jurisdiction of the courts of Singapore."
      }
    ]
  },
  {
    "id": "contact",
    "number": "46",
    "title": "46. CONTACT",
    "category": "General Provisions",
    "content": [
      {
        "type": "paragraph",
        "text": "For questions regarding these Terms, Subscription, billing or the Xentra service, the Customer may contact DORT Asia through our official channels:"
      },
      {
        "type": "contactCard",
        "company": "DORT Asia",
        "location": "Singapore",
        "email": "enquiry@dortasia.com",
        "website": "https://dortasia.com"
      }
    ]
  }
];

export default function TermsAndConditionsPage() {
  const [activeSectionId, setActiveSectionId] = useState('preamble');
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentProgress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(currentProgress);
      setShowBackToTop(window.scrollY > 400);

      const sectionElements = termsData.map(sec => document.getElementById(sec.id)).filter(Boolean);
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSectionId(termsData[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navbar with Dark Theme for seamless blend with Dark Header */}
      <Navbar theme="dark" />

      {/* HERO BANNER - SLEEK MIDNIGHT BLACK & DEEP BLUE WITH AMBIENT GLOW */}
      <header className="relative bg-[#050811] overflow-hidden pt-36 pb-16 sm:pt-40 sm:pb-20 text-white">
        
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute -right-24 -top-24 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent blur-3xl" />
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-transparent blur-2xl" />
          <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-slate-900 via-blue-950/40 to-transparent blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs">
                Legal & Compliance
              </span>
              <span className="text-slate-400 text-xs font-medium">
                Last Updated: 17 August 2026
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Terms and Conditions
            </h1>
          </div>

          {/* Right Action: Share & Print Pills */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center print:hidden">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 px-4 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-900" />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              aria-label="Print Document"
              className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-lg border border-white/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* REFINED ACCENT SEPARATOR LINE (DEEP BLUE / CYAN GRADIENT) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-400 to-blue-600" />

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow bg-white py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* 2-COLUMN LAYOUT: QUICK NAV ON LEFT + PROFESSIONAL CLAUSES ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT COLUMN: STICKY SECTION NAV (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto minimal-scrollbar pr-2 print:hidden">
            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Clauses ({termsData.length})
                </h4>
                <span className="text-[11px] font-medium text-slate-400">
                  Quick Jump
                </span>
              </div>

              <nav className="space-y-0.5 text-xs">
                {termsData.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const target = document.getElementById(sec.id);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                          setActiveSectionId(sec.id);
                        }
                      }}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate pr-2">{sec.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* RIGHT COLUMN: PROFESSIONAL CLAUSES LIST */}
          <div className="lg:col-span-8 space-y-12">
            {termsData.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-28 transition-all border-b border-slate-200 pb-10 last:border-b-0"
              >
                {/* Modern Bold Heading */}
                <div className="mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900 mb-1">
                    {sec.title}
                  </h2>
                </div>

                {/* Section Content */}
                <div className="space-y-3.5 text-slate-700 text-sm sm:text-[15px] leading-relaxed">
                  {sec.content.map((item, index) => {
                    switch (item.type) {
                      case 'paragraph':
                        return <p key={index}>{item.text}</p>;

                      case 'definitions':
                        return (
                          <div key={index} className="grid grid-cols-1 gap-2.5 my-4">
                            {item.items.map((def, dIdx) => (
                              <div key={dIdx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                                <span className="font-bold text-slate-900">{def.term} </span>
                                <span className="text-slate-700">{def.desc}</span>
                              </div>
                            ))}
                          </div>
                        );

                      case 'list':
                        return (
                          <ul key={index} className="space-y-1.5 my-3 pl-2">
                            {item.items.map((li, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                                <span>{li}</span>
                              </li>
                            ))}
                          </ul>
                        );

                      case 'numbered':
                        return (
                          <ol key={index} className="space-y-1.5 my-3 pl-2">
                            {item.items.map((li, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-[15px] text-slate-700">
                                <span className="font-mono font-bold text-xs text-blue-600 mt-1 shrink-0">{lIdx + 1}.</span>
                                <span>{li}</span>
                              </li>
                            ))}
                          </ol>
                        );

                      case 'subheading':
                        return (
                          <h3 key={index} className="text-sm font-bold uppercase tracking-wider text-slate-900 mt-5 mb-1.5">
                            {item.title}
                          </h3>
                        );

                      case 'callout':
                        return (
                          <div key={index} className="my-4 p-4 rounded-xl bg-slate-900 text-white shadow-xs">
                            <h4 className="text-xs uppercase font-bold tracking-wider text-sky-400 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                              {item.text}
                            </p>
                          </div>
                        );

                      case 'flowchart':
                        return (
                          <div key={index} className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-900 mb-2.5">
                              Escalation Process Flow
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                              {item.steps.map((step, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  <span className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-800 shadow-2xs">
                                    {step}
                                  </span>
                                  {sIdx < item.steps.length - 1 && (
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );

                      case 'contactCard':
                        return (
                          <div key={index} className="my-4 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base">{item.company}</h4>
                              <p className="text-xs text-slate-500">{item.location}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <a
                                href={`mailto:${item.email}`}
                                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                Email: {item.email}
                              </a>
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                Website
                              </a>
                            </div>
                          </div>
                        );

                      default:
                        return null;
                    }
                  })}
                </div>
              </section>
            ))}

            {/* IMPORTANT STATUTORY NOTICE BANNER */}
            <div className="bg-slate-950 text-white rounded-2xl p-8 sm:p-10 shadow-md border border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <Scale className="w-6 h-6 text-sky-400" />
                <h3 className="text-xl font-bold text-white">Important Statutory Notice</h3>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                Xentra is an enterprise software platform designed to support HR, payroll, workforce administration and compliance-related workflows. The Customer remains solely responsible for the accuracy of its information, its employment practices, payroll decisions, statutory obligations (including CPF, FWL, IRAS tax, MOM reporting), and compliance with applicable laws and regulations.
              </p>
              <p className="text-slate-400 text-xs font-mono">
                Nothing in these Terms constitutes legal, tax, accounting, employment or other professional advice.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                <span>© 2026 DORT Asia. All rights reserved.</span>
                <span>Republic of Singapore</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-8 right-8 z-40 p-3.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center print:hidden group cursor-pointer border border-slate-700"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      <Footer />
    </div>
  );
}
