# ClaimsProcessing-FrontEnd
A React + TypeScript web application that provides an intuitive user interface for uploading claim documents, reviewing extracted details, editing missing fields, and viewing the final claim payout based on SDI policy coverage.

## Key Features
→ Upload up to four claim-related documents (Lease Agreement, SDI Addendum, Tenant Notification, Move-Out/Tenant Ledger)  
→ AI-powered extraction using the backend’s Anthropic Claude Sonnet 4 integration  
→ Interactive preview step to review and edit extracted data  
→ Automatic evaluation of SDI coverage with clear Claim Receipt view  

## Tech Stack
Language: TypeScript  
Framework: React (Vite)  
Styling: CSS  
HTTP Client: Axios  

## How to Install and Run the Project
### Prerequisites

Node.js 18 or higher  
Backend service running locally on port 8080  

## Setup
### Clone the repository
git clone https://github.com/SaiBharathReddy/ClaimsProcessing-FrontEnd.git  
cd ClaimsProcessing-Frontend/claims-processing  

### Install dependencies
npm install

### Run the development server
npm run dev


The frontend will start at http://localhost:5173



## DEMO

### * This is the initial screen where we can upload the documents and enter the policy number which we use to fecth details from Excel that might be missing in the uploaded documents.
<img width="984" height="732" alt="image" src="https://github.com/user-attachments/assets/77bc0b9e-c5cf-4d9e-89a7-d6e478e33cd6" />  

### * Following is the screen after uploading the required documents.
<img width="984" height="722" alt="image" src="https://github.com/user-attachments/assets/b7973e94-cda6-4148-a152-a984f550ac18" />  

### * Following is the screen after clicking the "Extract" button.
<img width="984" height="722" alt="image" src="https://github.com/user-attachments/assets/87e797fb-43ac-48e7-bb35-2fbb9d5a45d5" />  

### * Following are the screens after the extraction is completed. Details are auto-populated. Note: PII is hidden
<img width="1105" height="852" alt="Screenshot 2025-11-05 at 10 25 51 PM" src="https://github.com/user-attachments/assets/adaee06b-2dcd-4c36-907c-c0a08d0d146a" />  
<img width="1105" height="874" alt="image" src="https://github.com/user-attachments/assets/891e1720-9bda-43c4-a65f-0270a7f6a2fd" />

### * Following are the screen after "Analyze" button is clicked on the previous screen. Once the button is clicked, we use the information to process the final payout amount and display the claim status (approved/declined).
<img width="1105" height="852" alt="Screenshot 2025-11-05 at 10 18 12 PM" src="https://github.com/user-attachments/assets/12d6e688-9a27-45bc-b8cf-33d074ddf635" />  
<img width="1105" height="852" alt="image" src="https://github.com/user-attachments/assets/981dbfec-5a3e-492b-921b-927f47faa047" />







