# **PROJECT SETUP — INPUT QUERIES & INPUT STYLES**
Complete Guide to Form Inputs, Field Types & Document Requirements

## **Table of Contents**
- Step 1: Project Basics
- Step 2: Project Duration
- Step 3: Client Details (External Only)
- Step 4: Commercial Details (External Only)
- Step 5: Salary & Billing (Manpower Supply Only)
- Step 6: Site & Worksite Details
- Step 7: Accommodation & Transport
- Step 8: Budget
- Step 9: Compliance & Insurance
- Step 10: Document Uploads
- Step 11: Assign Employees & Review


## **STEP 1: PROJECT BASICS**
Core project information. All fields required to proceed.

### **Input 1.1 — Project Name**

|**Field Label**|**Project Name**|
| :- | :- |
|Question to Ask|What is the Project Name?|
|Input Type|Text Input|
|Placeholder|e.g., RNS Technology, ABC Manufacturing Site A|
|Required|✓ YES|
|Validation|Not empty, must be unique in system|
|Help Text|This will be the primary identifier for your project|
|Max Length|255 characters|
|UI Pattern|Single-line text field with real-time validation|

### **Input 1.2 — Project Type**

|**Field Label**|**Project Type**|
| :- | :- |
|Question to Ask|Is this an Internal or External Project?|
|Input Type|Radio Select (2 options)|
|Option 1|Internal Project (Company-owned work, no client)|
|Option 2|External Project (Work for external client)|
|Required|✓ YES|
|Default Value|None (must select)|
|Help Text|Internal = R&D, office setup, admin work | External = Work for paying client|
|Conditional Logic|Selection controls which subsequent steps appear|

### **Input 1.3 — Project Status**

|**Field Label**|**Project Status**|
| :- | :- |
|Question to Ask|What is the current status of this project?|
|Input Type|Dropdown Select|
|Options|On Process (default) | On Hold | Completed | Cancelled|
|Required|✓ YES|
|Default Value|On Process|
|Help Text|Status determines if project can receive new assignments|
|UI Behavior|On selection change, show/hide relevant sections|

### **Input 1.4 — Project Manager**

|**Field Label**|**Project Manager**|
| :- | :- |
|Question to Ask|Who is the Project Manager?|
|Input Type|Employee Select (Autocomplete/Searchable Dropdown)|
|Placeholder|Search employee name...|
|Search By|Employee Name, Employee ID, Email|
|Required|✓ YES|
|Data Returned|Employee ID, Name, Title, Avatar, Email|
|Help Text|The person responsible for managing this project|
|Validation|Must be active employee in system|
|UI Pattern|Search input + dropdown list with employee cards|

### **Input 1.5 — Description**

|**Field Label**|**Description**|
| :- | :- |
|Question to Ask|Add a brief description (optional)|
|Input Type|Textarea|
|Placeholder|e.g., Supply of 50 technicians for 6 months at ABC Manufacturing...|
|Required|❌ NO (Optional)|
|Max Length|500 characters|
|Rows|4 lines|
|Character Counter|Show: {current}/{max}|
|Help Text|Short summary of project scope and objectives|

ACTION: Click 'Next →' to proceed to Step 2

## **STEP 2: PROJECT DURATION**
Define project timeline and working schedule.

### **Input 2.1 — Start Date**

|**Field Label**|**Start Date**|
| :- | :- |
|Question to Ask|When does the project start?|
|Input Type|Date Picker (Calendar Widget)|
|Display Format|DD/MM/YYYY|
|Storage Format|YYYY-MM-DD|
|Required|✓ YES|
|Min Date|Today or future|
|Help Text|Project commencement date|
|Validation|Cannot be in the past|

### **Input 2.2 — End Date**

|**Field Label**|**End Date**|
| :- | :- |
|Question to Ask|When does the project end?|
|Input Type|Date Picker (Calendar Widget)|
|Display Format|DD/MM/YYYY|
|Storage Format|YYYY-MM-DD|
|Required|✓ YES|
|Min Date|Must be ≥ Start Date|
|Help Text|Project completion date|
|Validation|End Date must be after Start Date|

### **Input 2.3 — Contract Duration (Auto-Calculated)**

|**Field Label**|**Project Duration**|
| :- | :- |
|Display Type|Read-only Text|
|Calculation|End Date - Start Date|
|Format|30 days OR 1 month 5 days|
|Update Trigger|Auto-updates when Start/End dates change|
|Help Text|Automatically calculated from dates above|
|UI Behavior|Display in grey/disabled state (non-editable)|

### **Input 2.4 — Working Days**

|**Field Label**|**Working Days**|
| :- | :- |
|Question to Ask|Which days will the project operate?|
|Input Type|Multi-Select Checkboxes|
|Options|Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday|
|Required|❌ NO (Optional)|
|Default|Mon-Fri (pre-checked)|
|Help Text|Check all days the project is active|
|UI Pattern|7 individual checkboxes in a row|

### **Input 2.5 — Working Hours**

|**Field Label**|**Working Hours**|
| :- | :- |
|Question to Ask|What are the working hours?|
|Input Type|Time Range Picker (From - To)|
|Format|HH:MM (24-hour)|
|Placeholder From|08:00|
|Placeholder To|17:00|
|Required|❌ NO (Optional)|
|Validation|End time must be after start time|
|Help Text|e.g., 08:00 – 17:00 (8 AM to 5 PM)|

### **Input 2.6 — Shift Type**

|**Field Label**|**Shift Type**|
| :- | :- |
|Question to Ask|What type of shift(s) does this project run?|
|Input Type|Multi-Select Checkboxes|
|Options|Day Shift | Night Shift | Rotational Shift|
|Required|❌ NO (Optional)|
|Help Text|Check all applicable shift types|
|UI Pattern|3 individual checkboxes|

### **Input 2.7 — Overtime Applicable**

|**Field Label**|**Overtime Applicable?**|
| :- | :- |
|Question to Ask|Is overtime applicable for this project?|
|Input Type|Toggle Switch (Yes / No)|
|Required|❌ NO (Optional)|
|Default Value|No|
|Help Text|Enable if workers can claim overtime pay|
|Related Fields|If Yes → Show Overtime Rate field (in Step 5)|

ACTION: Click 'Next →' to proceed to Step 3

## **STEP 3: CLIENT DETAILS**
CONDITIONAL: Only shown if Project Type = 'External Project'

### **Input 3.1 — External Type**

|**Field Label**|**External Project Type**|
| :- | :- |
|Question to Ask|What type of external project is this?|
|Input Type|Radio Select (3 options)|
|Option 1|Manpower Supply (Supply workers only)|
|Option 2|Material Supply (Supply equipment/materials)|
|Option 3|Full Project (Complete execution with labor + materials)|
|Required|✓ YES|
|Help Text|This determines which sections appear next|
|Conditional Logic|Selection controls visibility of Site, Salary, Accommodation fields|

### **Input 3.2 — Client Company**

|**Field Label**|**Client Company**|
| :- | :- |
|Question to Ask|Which company is the client?|
|Input Type|Company Select (Autocomplete Dropdown)|
|Placeholder|Search or create company...|
|Search By|Company Name, UEN|
|Required|✓ YES|
|Data Returned|Company ID, Name, UEN, Contact Info|
|Inline Create|Allow 'Create New Company' option if not found|
|Help Text|Select existing company or create new one|

### **Input 3.3 — Contact Person**

|**Field Label**|**Contact Person**|
| :- | :- |
|Question to Ask|Who is the primary contact at the client?|
|Input Type|Text Input|
|Placeholder|e.g., John Smith|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Name of primary point of contact|

### **Input 3.4 — Contact Email**

|**Field Label**|**Contact Email**|
| :- | :- |
|Question to Ask|What is the contact email?|
|Input Type|Email Input|
|Placeholder|contact@company.com|
|Required|❌ NO (Optional)|
|Validation|Valid email format|
|Help Text|Email for billing and communication|

### **Input 3.5 — Contact Phone**

|**Field Label**|**Contact Phone**|
| :- | :- |
|Question to Ask|What is the contact phone number?|
|Input Type|Phone Input|
|Placeholder|+65 6XX XXXX|
|Required|❌ NO (Optional)|
|Format|With country code|
|Help Text|Phone number for urgent communication|

### **Input 3.6 — Billing Address**

|**Field Label**|**Billing Address**|
| :- | :- |
|Question to Ask|What is the client's billing address?|
|Input Type|Textarea|
|Placeholder|123 Business Street, Singapore 123456|
|Required|❌ NO (Optional)|
|Max Length|500 characters|
|Rows|3 lines|
|Help Text|Address where invoices should be sent|

### **Input 3.7 — Contract Number**

|**Field Label**|**Contract Number**|
| :- | :- |
|Question to Ask|What is the contract reference number?|
|Input Type|Text Input|
|Placeholder|e.g., CNT-2026-0123|
|Required|❌ NO (Optional)|
|Max Length|100 characters|
|Help Text|Reference number of signed agreement|

### **Input 3.8 — UEN / Tax ID**

|**Field Label**|**UEN / Tax Registration**|
| :- | :- |
|Question to Ask|What is the client's UEN or Tax ID?|
|Input Type|Text Input|
|Placeholder|e.g., 202312345K|
|Required|❌ NO (Optional)|
|Max Length|50 characters|
|Help Text|Singapore company registration number|

ACTION: Click 'Next →' to proceed to Step 4

## **STEP 4: COMMERCIAL DETAILS**
CONDITIONAL: Only shown if Project Type = 'External Project'

### **Input 4.1 — Contract Value**

|**Field Label**|**Contract Value**|
| :- | :- |
|Question to Ask|What is the total contract value?|
|Input Type|Number Input|
|Placeholder|1000000|
|Required|❌ NO (Optional)|
|Min Value|0|
|Currency Symbol|Displayed as S$ {amount}|
|Help Text|Total contract amount in selected currency|
|Decimal Places|2 (e.g., 1000000.50)|

### **Input 4.2 — Currency**

|**Field Label**|**Currency**|
| :- | :- |
|Question to Ask|What currency is the contract in?|
|Input Type|Dropdown Select|
|Options|SGD (default) | USD | MYR | Others|
|Required|❌ NO (Optional)|
|Default Value|SGD|
|Help Text|Currency for all financial tracking|
|Related Fields|Used in Contract Value, Billing Rate fields|

### **Input 4.3 — Payment Cycle**

|**Field Label**|**Payment Cycle**|
| :- | :- |
|Question to Ask|What is the payment cycle?|
|Input Type|Dropdown Select|
|Options|Immediate | 15 Days | 30 Days | 45 Days | 60 Days | 90 Days | Custom|
|Required|❌ NO (Optional)|
|Conditional|If 'Custom' → Show text input for custom days|
|Help Text|How long before payment is due after invoice|
|Related Fields|Used in cash flow forecasting|

### **Input 4.4 — Invoice Frequency**

|**Field Label**|**Invoice Frequency**|
| :- | :- |
|Question to Ask|How often will invoices be sent?|
|Input Type|Radio Select (4 options)|
|Option 1|One Time (Single invoice at project end)|
|Option 2|Monthly (Recurring monthly invoices)|
|Option 3|Milestone (Based on project milestones)|
|Option 4|Progress Billing (Based on progress percentage)|
|Required|❌ NO (Optional)|
|Help Text|Determines billing schedule|
|Impact|Affects revenue tracking|

### **Input 4.5 — Tax %**

|**Field Label**|**Tax %**|
| :- | :- |
|Question to Ask|What tax percentage applies?|
|Input Type|Number Input (Decimal)|
|Placeholder|7|
|Required|❌ NO (Optional)|
|Min Value|0|
|Max Value|100|
|Decimal Places|2 (e.g., 7.50%)|
|Help Text|GST or VAT percentage on invoices|
|Example|If tax = 7%, invoice amount is multiplied by 1.07|

### **Input 4.6 — Retention %**

|**Field Label**|**Retention %**|
| :- | :- |
|Question to Ask|What percentage is retained by client?|
|Input Type|Number Input (Decimal)|
|Placeholder|10|
|Required|❌ NO (Optional)|
|Min Value|0|
|Max Value|100|
|Decimal Places|2 (e.g., 10.00%)|
|Help Text|Percentage of invoice held back until project completion|
|Example|If retention = 10%, only 90% is paid immediately|

### **Input 4.7 — Payment Method**

|**Field Label**|**Payment Method**|
| :- | :- |
|Question to Ask|How will the client pay?|
|Input Type|Multi-Select Checkboxes|
|Options|Bank Transfer | Cash | Cheque | Credit Card|
|Required|❌ NO (Optional)|
|Help Text|Check all payment methods client can use|
|UI Pattern|4 individual checkboxes|

ACTION: Click 'Next →' to proceed to Step 5

## **STEP 5: SALARY & BILLING**
CONDITIONAL: Only shown if External Type = 'Manpower Supply'

### **Input 5.1 — Salary Type**

|**Field Label**|**Salary Type**|
| :- | :- |
|Question to Ask|How are workers compensated?|
|Input Type|Radio Select (3 options)|
|Option 1|Daily (Rate per working day)|
|Option 2|Monthly (Fixed monthly salary)|
|Option 3|Hourly (Rate per hour worked)|
|Required|❌ NO (Optional)|
|Help Text|Determines salary calculation method|
|Conditional Logic|Selection affects which rate fields appear|

### **Input 5.2 — Basic Rate**

|**Field Label**|**Basic Rate**|
| :- | :- |
|Question to Ask|What is the basic compensation rate?|
|Input Type|Number Input (Decimal)|
|Placeholder|100|
|Required|❌ NO (Optional)|
|Currency|Displayed with currency symbol (S$, USD, etc.)|
|Decimal Places|2|
|Help Text|Per day, per month, or per hour (based on Salary Type)|
|Example|If Daily: S$100/day | If Hourly: S$25/hour|

### **Input 5.3 — Overtime Rate**

|**Field Label**|**Overtime Rate**|
| :- | :- |
|Question to Ask|What is the overtime rate?|
|Input Type|Number Input (Decimal)|
|Placeholder|50|
|Required|❌ NO (Optional, if Overtime Applicable = Yes)|
|Currency|Same as contract currency|
|Decimal Places|2|
|Help Text|Usually 1.5x or 2x the basic rate, per hour|
|Example|Basic = S$100/day → Overtime = S$50/hour (or 1.5x)|

### **Input 5.4 — Food Allowance**

|**Field Label**|**Food Allowance**|
| :- | :- |
|Question to Ask|What food allowance is provided?|
|Input Type|Number Input (Decimal)|
|Placeholder|5|
|Required|❌ NO (Optional)|
|Currency|Same as contract currency|
|Decimal Places|2|
|Help Text|Per day or per month, depending on payroll structure|
|Example|S$5/day or S$100/month|

### **Input 5.5 — Accommodation Allowance**

|**Field Label**|**Accommodation Allowance**|
| :- | :- |
|Question to Ask|What accommodation allowance is provided?|
|Input Type|Number Input (Decimal)|
|Placeholder|300|
|Required|❌ NO (Optional)|
|Currency|Same as contract currency|
|Decimal Places|2|
|Help Text|Per month (for lodging/housing)|
|Example|S$300/month|

### **Input 5.6 — Transport Allowance**

|**Field Label**|**Transport Allowance**|
| :- | :- |
|Question to Ask|What transport allowance is provided?|
|Input Type|Number Input (Decimal)|
|Placeholder|5|
|Required|❌ NO (Optional)|
|Currency|Same as contract currency|
|Decimal Places|2|
|Help Text|Per day or per trip|
|Example|S$5/day or S$10/trip|

### **Input 5.7 — Client Billing Rate**

|**Field Label**|**Client Billing Rate**|
| :- | :- |
|Question to Ask|What rate do you charge the client?|
|Input Type|Number Input (Decimal)|
|Placeholder|150|
|Required|❌ NO (Optional)|
|Currency|Same as contract currency|
|Decimal Places|2|
|Help Text|Amount charged to client per day/hour/month|
|Example|If basic = S$100/day, billing rate = S$150/day (margin = S$50)|

### **Input 5.8 — Invoice Cycle**

|**Field Label**|**Invoice Cycle**|
| :- | :- |
|Question to Ask|How often should invoices be sent?|
|Input Type|Radio Select (3 options)|
|Option 1|Weekly|
|Option 2|Bi-Weekly|
|Option 3|Monthly|
|Required|❌ NO (Optional)|
|Default Value|Monthly|
|Help Text|Frequency of invoicing to client|

ACTION: Click 'Next →' to proceed to Step 6

## **STEP 6: SITE & WORKSITE DETAILS**
CONDITIONAL: Only shown if External Type = 'Manpower Supply' OR 'Full Project'

### **Input 6.1 — Worksite Address**

|**Field Label**|**Worksite Address**|
| :- | :- |
|Question to Ask|What is the physical worksite address?|
|Input Type|Textarea|
|Placeholder|123 Industrial Street, Jurong, Singapore 654321|
|Required|✓ YES (for Manpower/Full Projects)|
|Max Length|500 characters|
|Rows|3 lines|
|Help Text|Physical location where work is performed|
|Used For|GPS tracking, employee navigation|

### **Input 6.2 — Site Location (GPS)**

|**Field Label**|**Site Location (GPS)**|
| :- | :- |
|Question to Ask|What are the GPS coordinates?|
|Input Type|Map Pin Input OR Text (Latitude, Longitude)|
|Placeholder|1\.3521, 103.8198|
|Required|❌ NO (Optional)|
|Format|Decimal format: -90 to +90 (lat), -180 to +180 (lon)|
|Example|Latitude: 1.3521, Longitude: 103.8198|
|Help Text|For accurate location-based attendance tracking|
|UI Pattern|Map picker OR two number inputs (Lat/Lon)|

### **Input 6.3 — Site Access Pass Required?**

|**Field Label**|**Site Access Pass Required?**|
| :- | :- |
|Question to Ask|Do workers need site access passes?|
|Input Type|Toggle Switch (Yes / No)|
|Required|❌ NO (Optional)|
|Default Value|No|
|Conditional Logic|If Yes → Show 'Pass Type' field|
|Help Text|Enable if client requires entry permits/passes|

### **Input 6.4 — PPE Required?**

|**Field Label**|**PPE (Personal Protective Equipment) Required?**|
| :- | :- |
|Question to Ask|Is PPE required at the site?|
|Input Type|Toggle Switch (Yes / No)|
|Required|❌ NO (Optional)|
|Default Value|No|
|Conditional Logic|If Yes → Show 'PPE Types' multi-select|
|Help Text|Enable if safety equipment is mandatory|

### **Input 6.5 — PPE Types**

|**Field Label**|**PPE Types**|
| :- | :- |
|Question to Ask|Which PPE items are required?|
|Input Type|Multi-Select Checkboxes|
|Options|Hard Hat / Helmet | Safety Vest | Safety Boots | Gloves | Safety Goggles | Face Mask | Others|
|Required|❌ NO (conditional, if PPE Required = Yes)|
|Help Text|Check all required PPE items|
|UI Pattern|7+ individual checkboxes|

### **Input 6.6 — Site Reporting Time**

|**Field Label**|**Site Reporting Time**|
| :- | :- |
|Question to Ask|What time must workers report to site?|
|Input Type|Time Picker|
|Format|HH:MM (24-hour)|
|Placeholder|07:30|
|Required|❌ NO (Optional)|
|Help Text|Time when workers must be on-site|
|Example|07:30 (7:30 AM)|

### **Input 6.7 — Site Supervisor / IC**

|**Field Label**|**Site Supervisor / In-Charge (IC)**|
| :- | :- |
|Question to Ask|Who is the site supervisor or in-charge?|
|Input Type|Text Input OR Employee Search|
|Placeholder|Name or search employee...|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Name of person responsible at site|
|Can Link To|Internal employee or external contact|

### **Input 6.8 — Site Rules / Instructions**

|**Field Label**|**Site Rules / Instructions**|
| :- | :- |
|Question to Ask|What rules or instructions apply at the site?|
|Input Type|Textarea|
|Placeholder|1\. No smoking inside facility\n2. Mandatory safety briefing on first day\n3. Report accidents immediately...|
|Required|❌ NO (Optional)|
|Max Length|1000 characters|
|Rows|6 lines|
|Help Text|Safety briefing notes, special instructions, client requirements|
|Used For|Employee orientation, compliance documentation|

ACTION: Click 'Next →' to proceed to Step 7

## **STEP 7: ACCOMMODATION & TRANSPORT**
CONDITIONAL: Only shown if External Type = 'Manpower Supply'

### **Input 7.1 — Dormitory Name**

|**Field Label**|**Dormitory Name**|
| :- | :- |
|Question to Ask|What is the name of the dormitory/lodging?|
|Input Type|Text Input|
|Placeholder|e.g., Riverside Worker Hostel|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Name of accommodation facility|

### **Input 7.2 — Dormitory Address**

|**Field Label**|**Dormitory Address**|
| :- | :- |
|Question to Ask|What is the address of the dormitory?|
|Input Type|Textarea|
|Placeholder|123 Lodging Street, Singapore 654321|
|Required|❌ NO (Optional)|
|Max Length|500 characters|
|Rows|3 lines|
|Help Text|Full address of accommodation facility|

### **Input 7.3 — Bed Allocation**

|**Field Label**|**Bed Allocation**|
| :- | :- |
|Question to Ask|How many beds are reserved for this project?|
|Input Type|Number Input (Integer)|
|Placeholder|50|
|Required|❌ NO (Optional)|
|Min Value|1|
|Help Text|Total number of beds reserved at the dorm|
|Example|50 beds for 50 workers|

### **Input 7.4 — Transport Vendor**

|**Field Label**|**Transport Vendor**|
| :- | :- |
|Question to Ask|Which company provides transport?|
|Input Type|Text Input OR Vendor Select|
|Placeholder|e.g., ABC Logistics, XYZ Transport|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Name of transport service provider|

### **Input 7.5 — Pick-up Point**

|**Field Label**|**Pick-up Point**|
| :- | :- |
|Question to Ask|Where do workers board the transport?|
|Input Type|Text Input|
|Placeholder|e.g., Dormitory Main Gate, Bus Stop X|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Boarding location for transport to worksite|

### **Input 7.6 — Drop-off Point**

|**Field Label**|**Drop-off Point**|
| :- | :- |
|Question to Ask|Where is the drop-off location at the worksite?|
|Input Type|Text Input|
|Placeholder|e.g., Main Gate, Parking Lot A|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Worksite entry point where workers are dropped off|

ACTION: Click 'Next →' to proceed to Step 8

## **STEP 8: BUDGET**
Applicable to both Internal and External Projects

### **Input 8.1 — Budget Amount**

|**Field Label**|**Budget Amount**|
| :- | :- |
|Question to Ask|What is the total budget for this project?|
|Input Type|Number Input (Decimal)|
|Placeholder|100000|
|Required|❌ NO (Optional)|
|Min Value|0|
|Currency|Displayed as S$ {amount}|
|Decimal Places|2|
|Help Text|Total approved budget for project expenses|
|Used For|Track spending vs budget (Internal) or estimated cost (External)|

### **Input 8.2 — Budget Owner**

|**Field Label**|**Budget Owner**|
| :- | :- |
|Question to Ask|Who is responsible for the budget?|
|Input Type|Employee Select (Searchable)|
|Placeholder|Search employee...|
|Required|❌ NO (Optional)|
|Data Returned|Employee ID, Name, Email|
|Help Text|Person who approves budget usage and changes|
|Related Fields|Can be different from Project Manager|

### **Input 8.3 — Budget Approval Date**

|**Field Label**|**Budget Approval Date**|
| :- | :- |
|Question to Ask|When was the budget approved?|
|Input Type|Date Picker|
|Display Format|DD/MM/YYYY|
|Storage Format|YYYY-MM-DD|
|Required|❌ NO (Optional)|
|Help Text|Date when budget was formally approved|
|Used For|Compliance and audit trail|

ACTION: Click 'Next →' to proceed to Step 9

## **STEP 9: COMPLIANCE & INSURANCE**
Applicable to both Internal and External Projects

### **Input 9.1 — Insurance Provider**

|**Field Label**|**Insurance Provider**|
| :- | :- |
|Question to Ask|Which company provides the insurance?|
|Input Type|Text Input|
|Placeholder|e.g., AXA, Great Eastern, NTUC Income|
|Required|❌ NO (Optional)|
|Max Length|255 characters|
|Help Text|Name of insurance company providing coverage|

### **Input 9.2 — WICA Coverage**

|**Field Label**|**WICA Coverage**|
| :- | :- |
|Question to Ask|Is WICA (Workmen's Injury Compensation Act) coverage active?|
|Input Type|Toggle Switch (Yes / No)|
|Required|❌ NO (Optional)|
|Default Value|No|
|Help Text|Enable if Workmen's Injury Compensation coverage is in place|
|Related Field|If Yes → Show policy details field|

### **Input 9.3 — Project Insurance Expiry**

|**Field Label**|**Project Insurance Expiry**|
| :- | :- |
|Question to Ask|When does the project insurance expire?|
|Input Type|Date Picker|
|Display Format|DD/MM/YYYY|
|Storage Format|YYYY-MM-DD|
|Required|❌ NO (Optional)|
|Alert Logic|Alert user if expiry is within 30 days|
|Help Text|Date when insurance coverage expires|
|Compliance|Critical for regulatory compliance|

### **Input 9.4 — Safety Compliance Status**

|**Field Label**|**Safety Compliance Status**|
| :- | :- |
|Question to Ask|What is the safety compliance status?|
|Input Type|Dropdown Select|
|Options|Compliant | Pending | Non-Compliant|
|Required|❌ NO (Optional)|
|Default Value|Compliant|
|Help Text|Current safety compliance level|
|Alert Logic|Alert if Non-Compliant|

### **Input 9.5 — MOM Compliance Notes**

|**Field Label**|**MOM Compliance Notes**|
| :- | :- |
|Question to Ask|Are there any Ministry of Manpower (MOM) compliance notes?|
|Input Type|Textarea|
|Placeholder|e.g., S-Pass holders require annual renewal...\nFIN card expiry: 2026-12-31...|
|Required|❌ NO (Optional)|
|Max Length|1000 characters|
|Rows|4 lines|
|Help Text|Ministry of Manpower requirements or compliance notes|
|Used For|Track regulatory requirements for foreign workers|

ACTION: Click 'Next →' to proceed to Step 10

## **STEP 10: DOCUMENT UPLOADS**
Upload project-related documents. All formats: PDF, JPG, PNG, DOCX. Max 5MB per file.

### **Document Upload Specifications**

|**Document Type**|**Description**|**Accepted Format**|**When Required**|**Status**|
| :- | :- | :- | :- | :- |
|Service Agreement|Signed contract between company and client|PDF / DOCX|External Projects|❌ Optional|
|Quotation|Initial quotation submitted to client|PDF / DOCX|External Projects|❌ Optional|
|Purchase Order (PO)|Formal purchase order from client|PDF / JPG / PNG|Both|❌ Optional|
|Work Order|Work authorization document from client|PDF / DOCX|External Projects|❌ Optional|
|Safety Documents|Safety plan, risk assessment, method statement|PDF / DOCX|Manpower/Full Projects|❌ Optional|
|Employee Pass Copies|Scans of work passes (S-Pass, EP, Work Permit)|JPG / PNG|Manpower Projects|❌ Optional|
|Insurance Documents|Insurance certificate, WICA coverage proof|PDF / JPG|Projects with Insurance|❌ Optional|

ACTION: Click 'Next →' to proceed to Step 11

## **STEP 11: ASSIGN EMPLOYEES & REVIEW**
Optionally assign employees and review all project details before saving.

### **Input 11.1 — Assign Employees**

|**Field Label**|**Assign Employees**|
| :- | :- |
|Question to Ask|Which employees are assigned to this project?|
|Input Type|Multi-Select Employee Search (Autocomplete)|
|Placeholder|Search and select employees...|
|Required|❌ NO (Optional)|
|Search By|Employee Name, ID, Email|
|Data Returned|Employee ID, Name, Department, Avatar|
|Display|Selected employees shown as chips/tags|
|Can Remove|Click X on chip to deselect|
|Help Text|Leave blank to assign later. Can be updated anytime.|

### **Input 11.2 — Department**

|**Field Label**|**Department**|
| :- | :- |
|Question to Ask|Which internal department owns this project?|
|Input Type|Dropdown Select|
|Options|Select from existing departments or create new|
|Required|✓ YES|
|Help Text|Internal categorization for project tracking|
|Example Departments|Operations | Finance | Engineering | Admin | Sales|

### **Input 11.3 — Preview & Confirm**

|**Display Type**|**Read-only Summary**|
| :- | :- |
|Shows|All entered information across all 11 steps|
|Format|Organized by section with Edit buttons|
|Edit Option|Click 'Edit' to go back to specific step|
|Final Action|Click 'Create Project' to save|
|Success Message|"Project created successfully!" + redirect to project dashboard|
|Error Handling|Validate all required fields before allowing save|

ACTION: Click 'Create Project' to save

# **SUMMARY OF INPUT STYLES**

|**Input Type**|**Description**|**Used For**|
| :- | :- | :- |
|Text Input|Single-line text field|Project Name, Contact Person, Dormitory|
|Email Input|Email validation|Contact Email|
|Phone Input|Phone format validation|Contact Phone|
|Number Input|Decimal or integer|Budget, Rates, Allowances|
|Textarea|Multi-line text field|Description, Addresses, Rules|
|Date Picker|Calendar widget|Start Date, End Date, Insurance Expiry|
|Time Picker|Time input (HH:MM)|Working Hours, Site Reporting Time|
|Dropdown Select|Single selection|Project Status, Currency, Payment Cycle|
|Radio Select|Single option from group|Project Type, External Type, Salary Type|
|Multi-Select Checkbox|Multiple selections|Working Days, PPE Types, Payment Method|
|Toggle Switch|Yes / No|Overtime Applicable, PPE Required, WICA Coverage|
|Employee Select|Searchable dropdown|Project Manager, Budget Owner, Site IC|
|Company Select|Searchable dropdown|Client Company|
|File Upload|Document upload|Service Agreement, Insurance Docs|
|Map Pin Input|GPS coordinates|Site Location (Latitude/Longitude)|
|Read-only Display|Auto-calculated, non-editable|Contract Duration, Preview Summary|


# **VALIDATION RULES**
## **Required Field Validation**
- Project Name: Not empty, must be unique
- Project Type: Must select one option
- Project Manager: Must select existing employee
- Start Date: Must not be in the past
- End Date: Must be ≥ Start Date
- Client Company (External): Must select or create company
- Worksite Address (Manpower): Must not be empty
- Department: Must select existing or create new

## **Date Validation**
- Start Date cannot be in the past
- End Date must be ≥ Start Date
- Insurance Expiry must be valid date
- Budget Approval Date should be in past or today

## **Number Validation**
- Contract Value, Billing Rate, Budget: Must be ≥ 0
- Percentage fields (Tax, Retention): Must be 0-100
- Bed Allocation: Must be integer ≥ 1
- All decimal fields: Accept 2 decimal places

## **Format Validation**
- Email: Must follow standard email format
- Phone: Must include country code
- Time inputs: Valid HH:MM format (00:00-23:59)
- GPS Coordinates: Latitude (-90 to +90), Longitude (-180 to +180)

\*\*\* END OF DOCUMENT \*\*\*
