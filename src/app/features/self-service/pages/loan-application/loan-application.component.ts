import { Component, OnDestroy, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RoutingService } from '../../../../core/services/routing.service';
import { AccountOpeningService } from '../../services/account-opening.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SubscriptionsManager } from '../../../../core/helpers/SubscriptionsManager';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { AteAuthService } from '../../services/ate-auth.service';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzDrawerSize } from 'ng-zorro-antd/drawer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-loan-application',
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.scss'
})
export class LoanApplicationComponent  implements OnInit, OnDestroy, OnChanges {

  constructor(
      private messageService: NzMessageService,
      private routingService: RoutingService,
      private accountOpeningService: AccountOpeningService,
      private notification: NzNotificationService,
      private ateAuthService: AteAuthService,
      private route: ActivatedRoute,
      private cdr: ChangeDetectorRef,
      private breakpointObserver: BreakpointObserver
    ) {
      this.breakpointObserver.observe([
        Breakpoints.XSmall, // Phones
        Breakpoints.Small,  // Small tablets
      ]).subscribe((result) => {
        if (result.matches) {
          this.drawerSize = 'default'; // Smaller drawer on small screens
        } else {
          this.drawerSize = 'large'; // Large drawer for bigger screens
        }
      });
    }

    drawerSize: NzDrawerSize = 'large'; // Default size

    ngOnDestroy(): void {
      this.subs.dispose();
    }

    ngOnChanges(changes: SimpleChanges): void {
      this.cdr.detectChanges();
    }

    getTicket(req: any): void {
      this.accountOpeningService.queryTicket(req);
    }

    isGuarantor: boolean = false;
    guarantorRef: string = '';
    serviceName: string = '';
    isGuarantorLoggedIn: boolean = false;
    guarantorAcknowledgement: boolean = false;

    proceedToGuarantorLogin(){
      this.showLoginModal();
    }

    ngOnInit(): void {

      this.route.queryParams.subscribe((queryParams: any) => {
        if (queryParams['ref'] && queryParams['serviceName']) {
          this.isGuarantor = true;
          this.guarantorRef = queryParams['ref'];
          this.serviceName = queryParams['serviceName'];
          console.log("guarantor: ", this.isGuarantor);
          console.log("ref: ", this.guarantorRef);
          console.log("service: ", this.serviceName);
        }
      });

      this.route.queryParams.subscribe((queryParams: any) => {
        this.loanApplicationContinuation = queryParams['cont'];
        if (this.loanApplicationContinuation === 'true') {
          console.log("cont: ", this.loanApplicationContinuation);
          this.current = 3
        } else if (this.loanApplicationContinuation === 'false') {
          this.current = 2;
        }
      });

      this.route.queryParams.subscribe((queryParams: any) => {
        if (queryParams['ticketId'] != null || queryParams['ticketId'] != undefined) {
          console.log("id: ", queryParams['ticketId'])
          console.log("We are looking for the ticket")
          this.getTicket(queryParams['ticketId']);
        }
      });


      this.subs.add = this.accountOpeningService.queryTicketResponse$.subscribe((res: any) => {
        this.onQueryTicketResponse(res);
           })
      this.subs.add = this.ateAuthService.accEnquiryResponse$.subscribe((res: any) => {
        this.onGetAccountEnquiryResponse(res);
      });
      this.subs.add = this.accountOpeningService.createNewRecordResponse$.subscribe((res: any) => {
        this.onCreateNewRecordResponse(res);
      });
      this.subs.add = this.accountOpeningService.updateRecordResponse$.subscribe((res: any) => {
        this.onUpdateRecordResponse(res);
      });
      this.subs.add = this.accountOpeningService.updateGuarantorResponse$.subscribe((res: any) => {
        this.onUpdateGuarantorResponse(res);
      });
      this.subs.add = this.accountOpeningService.getLoanByRefResponse$.subscribe((res: any) => {
        this.onGetLoanByRefResponse(res);
      });
      this.subs.add = this.accountOpeningService.guarantorAccountEnquiryResponse$.subscribe((res: any) => {
        this.onGetGuarantorInformation(res);
      });
    }

    onQueryTicketResponse(res: any) {
      console.log(res);
      this.queryTicket = res.data;
    }

    onUpdateGuarantorResponse(res: any) {
      if(res.success) {
        this.notification.create('success', 'Success', 'Information submitted successfully');
        this.navigateTo('home');
      } else {
        this.notification.create('error', 'Error', 'Failed to submit information');
      }
      this.guarantorConfirmationLoader = false;
    }

    onGetLoanByRefResponse(res: any) {
      console.log(res)
      if(res.success) {
        this.notification.create('success', 'Success', res.message);
        this.loanByRefRetreived = true;
      } else {
        this.notification.create('error', 'Error', res.message);
      }
      this.getLoanByRefLoader = false;
    }

    guarantorConfirmationForm = {
      idNumber: '',
      otpReference: '',
      approve: false,
      enquiryRequest: false
     }

     loanByRefRetreived: boolean = false;

     guarantorConfirmationLoader: boolean = false;

     validateGuarantor() {
      this.guarantorConfirmationLoader = true;
      console.log(this.guarantorConfirmationForm);
      this.accountOpeningService.updateGuarantor(this.guarantorConfirmationForm, 'guarantor-validate');
     }

     getLoanByRefRequest = {
      idNumber: "",
      otpReference: "",
      enquiryRequest: true
    }

    getLoanByRefLoader: boolean = false;

     getLoanByRef() {
      this.getLoanByRefLoader = true;
      this.accountOpeningService.getLoanByRef(this.getLoanByRefRequest, 'guarantor-validate');
     }

    onLoginComplete(event: any) {
      if (!this.isGuarantor) {
        console.log(event);
        if (event.error) {
          this.errorMessage = event.data;
          this.showErrorModal();
        } else {
          this.userAccounts = event.data.userAccounts;
          this.loanApplicationForm.pidNumber = event.data.pidNumber;
          this.loanApplicationForm.mobileNumber = event.data.mobileNumber;
          this.loanApplicationForm.userId = event.data.userId;
          this.loanApplicationForm.customerName = event.data.customerName;
          this.loanApplicationForm.type = event.data.type;
          if(event.data.civilServant) {
            this.loanApplicationForm.ecNumber = event.data.ecNumber;
          }
          console.log(this.loanApplicationForm);
          this.current += 1;
        }
      } else {
        this.isGuarantorLoggedIn = true;
        this.guarantorConfirmationForm.idNumber = event.pidNumber;
      }
      this.closeLoginModal();
    }

  isErrorVisible = false;
     errorMessage?: string = "";

  showErrorModal(): void {
    this.isErrorVisible = true;
  }

  handleErrorCancel(): void {
    this.routingService.navigateByUrl('/');
    this.isErrorVisible = false;
  }





    tcVisible = false;

  open(): void {
    this.tcVisible = true;
  }

  close(): void {
    this.tcVisible = false;
  }

    loanApplicationAmount?: any;

    queryTicket?: any;

    gotTicketNumber: boolean = false;

    onUpdateRecordResponse(res: any) {
      console.log(res);
      if (res.success) {
        this.notification.create('success', 'Success', 'Request submitted successfully');
        this.navigateTo('home');
      } else {
        this.notification.create('error', 'Error', 'Request failed');
      }
      this.submitLoanApplicationLoader = false;
    }

    onCreateNewRecordResponse(res: any) {
      console.log(res);
      if (res.success) {
        this.notification.create('success', 'Success', res.message);
        this.savedTicketNumber = res.data.ticketId;
this.gotTicketNumber = true;
        this.isSubmitVisible = true;
      } else {
        this.notification.create('error', 'Error', res.message);
      }
      this.submitLoanApplicationLoader = false;
    }



    onGetAccountEnquiryResponse(res: any) {
      console.log(res)
      if (res.BRANCH) {
        this.loanApplicationForm.branch = res.BRANCH;
        console.log(this.loanApplicationForm)
      } else {
        this.notification.create('error', "Error", "Failed to process request");
      }
    }

    onCheckLoginDetailsResponse(res: any) {
      console.log(res);
      if (res.success) {
        this.otpIsVisible = true;
      } else {
        this.notification.create('error', 'Error', 'Invalid login details');
      }
    }

    onCheckOtpResponse(res: any) {
      console.log(res);
      if (res.success) {
        // this.notification.create('success', 'Success', 'Login successful');
        this.next();
      } else {
        this.notification.create('error', 'Error', 'Invalid OTP');
      }
    }

    subs = new SubscriptionsManager();
    isAcknowledged = false;
    isDisclaimerAcknowledged = false;

    userAccounts: any[] = [];
    savedTicketNumber?: any;

    isDoneVisible = false;

  handleDoneCancel(): void {
    this.isDoneVisible = false;
    this.navigateTo('home');
  }

  isSubmitVisible = false;

  handleSubmitCancel(): void {
    this.isSubmitVisible = false;
    this.navigateTo('home');
  }

  isLoginVisible = false;

  showLoginModal(): void {
    this.isLoginVisible = true;
  }

  closeLoginModal(): void {
    this.isLoginVisible = false;
  }


  current = 0;

  index = 'First-content';

  pre(): void {
    this.current -= 1;
  }

  next(): void {
    if (this.current == 0) {
      // this.current += 1;
        this.showLoginModal();
        return;
    }
    if (this.current === 1) {
      // TODO REMOVE COMMENT
      // this.loanApplicationForm.branch = "1040"
      this.ateAuthService.accountEnquiry({"account": this.loanApplicationForm.accountNumber})
      this.uploadAttachments();
      this.current += 1; // ✅ increment
      return;
    }
 else if (this.current == 3) {
      if (Number(this.queryTicket.record.additionalData.amount) > this.queryTicket.record.enquiryResult.maxQualifyingAmount_L) {
        this.notification.create('error', 'Error', 'The loan amount cannot be greater than the maximum quallifying amount')
      }
      else {
        this.current += 1;
      }
    }
    else {
      this.current += 1;
    }
  }

  submitLoanApplicationLoader: boolean = false;

  submitLoanApplication() {
    console.log(this.loanApplicationForm)
    this.submitLoanApplicationLoader = true;
    this.loanApplicationForm.nextRepaymentDate = this.formatDateToYMD(this.nextDate);
    // this.loanApplicationForm.guarantor = this.guarantorInformation;
    this.accountOpeningService.createNewRecord(this.loanApplicationForm, 'loans');
  }

  loanApplicationContinuation= '';

  formatDateToYMD(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  nextDate?: any;

  createLoanForm = {};

  done(): void {
    console.log('done');
    // this.onCreateNewRecordResponse({data: {id: 1, ticketId: '1234'}});
    // this.accountOpeningService.createNewRecord(this.createLoanForm);
  }

  async uploadAttachments() {

    try {
      const paySlipDocs = await this.processUpload(this.payslipFileList);
      const proofOfEmpDocs = await this.processUpload(this.proofOfEmpFileList);

      this.loanApplicationForm.payslip = paySlipDocs.length > 0 ? paySlipDocs[0].id : '';
      this.loanApplicationForm.proofOfEmployment = proofOfEmpDocs.length > 0 ? proofOfEmpDocs[0].id : '';


      console.log("-------------------");
      console.log(this.loanApplicationForm);
    } catch (error) {
      console.error("Error uploading attachments:", error);
    }
  }

  processUpload(fileList: any): Promise<any[]> {
    const uploadPromises: Promise<any>[] = [];

    fileList.forEach((file: any) => {
      const formData: FormData = new FormData();
      formData.append("files", file);
      formData.append("owner", "SS-LOANS");
      formData.append("temporary", "false");
      formData.append("operation", "UPLOAD");
      formData.append("path", "loan-application, " + this.loanApplicationForm.pidNumber);
      formData.append("namePrefix", this.loanApplicationForm.pidNumber);


      const uploadPromise = new Promise<any>((resolve, reject) => {
        this.accountOpeningService.uploadFile(formData).subscribe({
          next: (response) => {
            console.log(`Upload successful`, response);

            // Ensure response.data is properly extracted
            if (response && response.data) {
              resolve(response.data); // Resolve with data
            } else {
              console.error("Unexpected upload response format:", response);
              resolve([]); // Resolve with an empty array if response is not as expected
            }
          },
          error: (error) => {
            console.error(`Error uploading files`, error);
            reject(error);
          },
        });
      });

      uploadPromises.push(uploadPromise);
    });

    return Promise.all(uploadPromises).then((results) => {
      return results.flat(); // Flatten in case each upload returns multiple items
    });
  }

  selectedAccount?: any;

  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
  }

  otpIsVisible = false;


  loginForm = {
    username: '',
    password: '',
    grant_type: 'password',
    otp: '',
    otpRef: ''
  }

  authenticate() {
    let req = {
      username: 'MOBILE:' + this.loginForm.username,
      password: this.loginForm.password,
      grant_type: this.loginForm.grant_type,
      otp: this.loginForm.otp,
      otpRef: this.loginForm.otpRef
    }

    this.ateAuthService.getAccessToken(req)
  }

  onSelectAccount(value: any) {
    console.log(value)
    this.loanApplicationForm.accountNumber = value.number;
    this.loanApplicationForm.currency = value.currency;
    this.loanApplicationForm.repaymentAccount = value.repaymentAccount;
    console.log(this.loanApplicationForm);
  }

  isCurrencySelected: boolean = false;
  currencySelected?: any = '';
  filteredAccounts: any[] = [];

  onSelectCurrency() {
    this.filteredAccounts = this.userAccounts.filter(account => account.currency === this.currencySelected);
    this.isCurrencySelected = true;
    this.selectedAccount= "";
  }

  currencies = [
    'USD',
    'ZWG'
  ];

  isLoanApplicationFormFilled(
    form: any,
    payslipFileList: any[],
    proofOfEmpFileList: any[]
  ): boolean {
    const requiredFields = [
      "accountNumber",
      "salary",
      "employer",
      "loanPurpose",
      "employerIndustry",
      "propertyDensity",
      "propertyOwnership",
      "maritalStatus",
      "occupationClass",
      "salaryRange",
    ];

    // Find missing fields
    const missingFields = requiredFields.filter((field) => !form[field]);

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
    }

    const nextDateMissing = (this.nextDate == '' || this.nextDate == undefined || this.nextDate == null);

    if(nextDateMissing) {
      console.log("Next date is missing")
    }

    // Check if file lists are not empty
    const payslipMissing = payslipFileList.length === 0;
    const proofOfEmpMissing = proofOfEmpFileList.length === 0;

    if (payslipMissing) {
      console.log("Payslip files are missing");
    }

    if (proofOfEmpMissing) {
      console.log("Proof of employment files are missing");
    }

    return missingFields.length === 0 && !nextDateMissing && !payslipMissing && !proofOfEmpMissing;
  }


  loanApplicationForm = {
    branch: '',
    pidNumber: '',
    userId: '',
    accountNumber: '',
    currency: '',
    salary: '',
    employer: '',
    nextRepaymentDate: '',
    mobileNumber: '',

// FCB checks
    loanPurpose: '',
    employerIndustry: '',
    propertyDensity: '',
    propertyOwnership: '',
    maritalStatus: '',
    occupationClass: '',
    salaryRange: '',

    // DOCUMENTS
    payslip: '',
    proofOfEmployment: '',

    // NEW FIELDS
    repaymentAccount: '',
    ecNumber: '',
    customerName: '',
    type: '',


    // DEPRECATED
    // loanProduct: 'CONSUMER_LOAN',
    // tenure: '',
    // guarantor: {},
  }

  guarantorForm = {
    accountNumber: ''
  }

  guarantorInformation = {
    CATEGORY_ID: "",
    CURRENCY: "",
    BRANCH: "",
    MSISDN: "",
    CUSTOMER_ID: "",
    EMAIL: "",
    error: "",
    NAME: "",
    ACCOUNT: "",
    STATUS: "",
    NATIONAL_ID: "",
    AVAILABLE_BALANCE: "",
    success: false,
    ADDRESS: ""
  }

  getGuarantorInformationLoader: boolean = false;

  getGuarantorInformation() {
    this.getGuarantorInformationLoader = true;
    this.accountOpeningService.guarantorAccountEnquiry(this.guarantorForm.accountNumber);
  }

  onGetGuarantorInformation(res: any) {
    if(res.success) {
      this.notification.create('success', 'Success', 'Guarantor information retrieved successfully');
      this.guarantorInformation = res.data;
    } else {
      this.notification.create('error', 'Error', res.message);
    }
    this.getGuarantorInformationLoader = false;
  }

  disabledDate (current: Date): boolean {
    let today = new Date();
    return current < today
  }

  maskNumber(number: any) {
    let numStr = number.toString();
    return "*".repeat(numStr.length - 3) + numStr.slice(-3);
}

  loanTenure = [
    "3",
    "6",
    "12",
    "24",
    "36"
  ]

  payslipFileList: any[] = [];
  proofOfEmpFileList: any[] = [];

    checkPayslipUploadFile = (file: NzUploadFile): boolean => {
      this.payslipFileList = this.payslipFileList.concat(file);
      return false;
    }

    checkEmploymentUploadFile = (file: NzUploadFile): boolean => {
      this.proofOfEmpFileList = this.proofOfEmpFileList.concat(file);
      return false;
    }

  otpArray: string[] = Array(6).fill('');

  get otpValue(): string {
    return this.otpArray.join('');
  }

  isValidOTP(): boolean {
    return this.otpValue.length === 6;
  }


  onSubmit(): void {
    if (this.isValidOTP()) {
      console.log('OTP Submitted:', this.otpValue);
    } else {
      console.log('Invalid OTP');
    }
  }

  fcbFields = {
    "loan_purpose":[
      { "key": 1, "value": "Current Account Overdraft" },
      { "key": 2, "value": "Personal Loan Account" },
      { "key": 3, "value": "Auto Loan" },
      { "key": 4, "value": "Educational Loan" },
      { "key": 5, "value": "Home Improvement Loan" },
      { "key": 6, "value": "Consolidation Loan" },
      { "key": 7, "value": "Credit Card" },
      { "key": 8, "value": "Line Of Credit" },
      { "key": 9, "value": "Revolving Credit" },
      { "key": 10, "value": "Business Asset Loan" },
      { "key": 11, "value": "Business Improvement Loan" },
      { "key": 12, "value": "Renewable Energy Loan" },
      { "key": 13, "value": "Wholesale Lending" },
      { "key": 14, "value": "Other" }
    ],
    "employer_industry": [
      { "key": 1, "value": "Agriculture" },
      { "key": 2, "value": "Manufacturing" },
      { "key": 3, "value": "Mining/Quarrying" },
      { "key": 4, "value": "Energy/Water" },
      { "key": 5, "value": "Trade" },
      { "key": 6, "value": "Tourism/Restaurant/Hotels" },
      { "key": 7, "value": "Transport" },
      { "key": 8, "value": "Real Estate" },
      { "key": 9, "value": "Finance" },
      { "key": 10, "value": "Government" },
      { "key": 11, "value": "Other" },
      { "key": 12, "value": "Non/Unemployed" },
      { "key": 13, "value": "Unknown" },
      { "key": 14, "value": "Health" },
      { "key": 15, "value": "Private Security" },
      { "key": 16, "value": "Police" },
      { "key": 17, "value": "Army" },
      { "key": 18, "value": "Prisons & Correctional Services" },
      { "key": 19, "value": "ICT / Communications" },
      { "key": 20, "value": "Retail" }
    ],
    "property_density": [
      { "key": 1, "value": "Low" },
      { "key": 2, "value": "Medium" },
      { "key": 3, "value": "High" },
      { "key": 4, "value": "Rural" },
      { "key": 5, "value": "Industrial" }
    ],
    "property_ownership": [
      { "key": 1, "value": "Owned" },
      { "key": 2, "value": "Rented" },
      { "key": 3, "value": "Mortgaged" },
      { "key": 4, "value": "Parents" },
      { "key": 5, "value": "Employer Owned" }
    ],
    "marital_status": [
      { "key": "S", "value": "Single" },
      { "key": "M", "value": "Married" },
      { "key": "D", "value": "Divorced" },
      { "key": "W", "value": "Widowed" }
    ],
    "occupation_class": [
      { "key": 0, "value": "N/A" },
      { "key": 1, "value": "MANAGER" },
      { "key": 2, "value": "PROFESSIONAL" },
      { "key": 3, "value": "TECHNICIAN AND ASSOCIATE PROFESSIONAL" },
      { "key": 4, "value": "CLERICAL SUPPORT WORKER" },
      { "key": 5, "value": "SERVICE & SALES WORKERS" },
      { "key": 6, "value": "SKILLED AGRICULTURAL FORESTRY & FISHERY WORKER" },
      { "key": 7, "value": "CRAFT & RELATED TRADES WORKER" },
      { "key": 8, "value": "PLANT & MACHINE OPERATOR & ASSEMBLER" },
      { "key": 9, "value": "ELEMENTARY OCCUPANT" },
      { "key": 10, "value": "ARMED FORCES OCCUPANT" },
      { "key": 11, "value": "UNEMPLOYED" }
    ],
    "salary": [
      { "key": 1, "value": "0 – 150" },
      { "key": 2, "value": "151 – 250" },
      { "key": 3, "value": "251 – 500" },
      { "key": 4, "value": "501 – 1,000" },
      { "key": 5, "value": "1,001 – 2,000" },
      { "key": 6, "value": "2,001 – 5,000" },
      { "key": 7, "value": "Over 5,000" },
      { "key": 8, "value": "Unknown" }
    ]
  }

  confirmLoanApplicationLoader: boolean = false;

  confirmLoanApplication(){
    this.confirmLoanApplicationLoader = true;
    this.accountOpeningService.updateRecord(this.queryTicket);
  }

  cancelLoanApplication(){
    this.isDisclaimerAcknowledged = false;
    this.current -+ 1;
  }

  checkInformation(excludedFields: string[]): boolean {
    let result = !Object.entries(this.loanApplicationForm)
      .filter(([key]) => !excludedFields.includes(key)) // Exclude specified fields
      .map(([key, value]) =>
        typeof value === 'object' && value !== null ? Object.keys(value).length === 0 : value // Handle objects like `guarantor`
      )
      .some(value => value === '' || value === null); // Check for empty string or null

    return result && this.checkDocuments();
  }

  checkDocuments(): boolean {
    const fileLists = [
      this.payslipFileList,
      this.proofOfEmpFileList,
    ];

    return fileLists.every(list => list.length > 0);
  }


  generatePDF() {
    // @ts-ignore
    var data = document.getElementById('terms-and-conditions')!;
    html2canvas(data).then((canvas) => {
      var docName = 'AFC Commercial Bank Account Opening Terms and Conditions ' + new Date();
      var contentWidth = canvas.width;
      var contentHeight = canvas.height;
      //One page pdf shows the height of canvas generated by html page;
      var pageHeight = (contentWidth / 592.28) * 841.89;
      //html page height without pdf generation
      var leftHeight = contentHeight;
      //Page offset
      var position = 0;
      //a4 paper size [595.28841.89], width and height of image in pdf of canvas generated by html page
      var imgWidth = 595.28;
      var imgHeight = (592.28 / contentWidth) * contentHeight;

      //Return picture dataURL, parameters: picture format and sharpness (0-1)
      var pageData = canvas.toDataURL('image/jpeg', 1.0);

      let pdf = new jsPDF('p', 'pt', 'a4');

      //There are two heights to distinguish, one is the actual height of the html page, and the height of the generated pdf page (841.89)
      //When the content does not exceed the display range of one page of pdf, paging is not required
      if (leftHeight < pageHeight) {
        pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        while (leftHeight > 0) {
          pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          position -= 841.89;
          //Avoid adding blank pages
          if (leftHeight > 0) {
            pdf.addPage();
          }
        }
      }
      pdf.save(docName + '.pdf');
    });
  }




}
