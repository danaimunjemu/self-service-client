import { Component, OnDestroy, OnInit, ChangeDetectorRef, OnChanges, SimpleChanges, } from '@angular/core';
import countries from './countries';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RoutingService } from '../../../../core/services/routing.service';
import { AccountOpeningService } from '../../services/account-opening.service';
import { SubscriptionsManager } from '../../../../core/helpers/SubscriptionsManager';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { differenceInCalendarDays, setHours } from 'date-fns';
import { DisabledTimeFn, DisabledTimePartial, NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzDrawerSize } from 'ng-zorro-antd/drawer';


@Component({
  selector: 'app-account-opening',
  templateUrl: './account-opening.component.html',
  styleUrl: './account-opening.component.scss',
})
export class AccountOpeningComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private messageService: NzMessageService,
    private routingService: RoutingService,
    private accountOpeningService: AccountOpeningService,
    private notification: NzNotificationService,
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

  ngOnChanges(changes: SimpleChanges): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subs.dispose();
  }

  ngOnInit(): void {
    this.getBranches()
    this.subs.add = this.accountOpeningService.queryRegistrarResponse$.subscribe((res: any) => {
      this.onQueryRegistrarResponse(res);
    });
    this.subs.add = this.accountOpeningService.createNewRecordResponse$.subscribe((res: any) => {
      this.onCreateNewRecordResponse(res);
    });
    this.subs.add = this.accountOpeningService.getBranchesResponse$.subscribe((res: any) => {
      this.onGetBranchesResponse(res);
    });
  }

  getBranchesLoader: boolean = false;
  getBranches() {
    this.getBranchesLoader = true;
    this.accountOpeningService.getBranches();
  }

  onGetBranchesResponse(res: any){
    console.log(res);
    if (res.success == true) {
      this.idcBranches=res.data;
    }
    this.getBranchesLoader = false;
  }

  idcBranches?: any;

  onCreateNewRecordResponse(res: any) {
    console.log(res);
    if (res.data.id) {
      this.notification.create('success', 'Success', 'Request submitted successfully');
      this.savedTicketNumber = res.data.ticketId;
      this.isDoneVisible = true;
    } else {
      this.notification.create('error', 'Error', 'Request failed');
    }
    this.createAccountLoader = false;
  }

  savedTicketNumber?: any;

  restartEntries() {
    Object.keys(this.createAccountForm.personalInformation).forEach(
      key => this.createAccountForm.personalInformation[key as keyof typeof this.createAccountForm.personalInformation] = ''
    );
    this.createAccountForm.personalInformation.pidType = 'ID';
    this.title = [
      "DR",
      "REV"
    ]
    this.applicationState.registrarData = false;
  }

  // onQueryRegistrarResponse(res: any) {
  //   console.log(res);
  //   if (res.success) {
  //     if (res.data.Status == "A") {
  //       this.registrarResponse = res.data;
  //       this.applicationState.registrarData = true;
  //       this.processRegistrarData();
  //     } else {
  //       this.notification.create('error', 'Error', 'Information is invalid');
  //     }
  //   } else {
  //     this.notification.create('error', 'Error', 'Incorrect ID Number supplied');
  //   }
  //   this.queryRegistrarLoader = false;
  // }

  onQueryRegistrarResponse(res: any) {
    console.log(res);

    if (res.success) {
      if (res.data.Status == "A") {
        // Assuming dateOfBirth is a string in the format 'YYYY-MM-DD' (adjust if necessary)
        const dateOfBirth = this.parseDate(res.data.DateOfBirth);  // Convert to Date object
        // const dateOfBirth = this.parseDate("23/05/2010");  // Convert to Date object
        console.log('Date of birth:', res.data.DateOfBirth);
        console.log('Date of birth:', dateOfBirth);

        console.log(res.data)
        this.title = ["DR", "REV"]
        if(res.data.Sex == 'M') {
          console.log("MALE")
          this.title = [...this.title, "MR"];
        }
        if(res.data.Sex == 'F') {
          console.log("FEMALE")
          this.title = [...this.title, "MRS", "MISS", "MS"];
        }



        if (!dateOfBirth) {
          this.notification.create('error', 'Error', 'Invalid date of birth');
          return;
        }

        // Calculate age
        const age = this.calculateAge(dateOfBirth);
        console.log('Age:', age);

        // If age is less than 18, prevent them from proceeding
        if (age < 18) {
          this.queryRegistrarLoader = false;
          this.isAgeVisible = true;
          return;  // Stop further execution
        }

        // Proceed with registration if age is 18 or older
        this.registrarResponse = res.data;
        this.applicationState.registrarData = true;
        this.processRegistrarData();
      } else {
        this.notification.create('error', 'Error', 'Information is invalid');
      }
    } else {
      this.notification.create('error', 'Error', 'Incorrect ID Number supplied');
    }
    this.queryRegistrarLoader = false;
  }

  // Helper function to calculate age
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();

    // If birthday hasn't occurred yet this year, subtract 1 from age
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  // Helper function to parse the date string (DD/MM/YYYY) into a Date object
  parseDate(dateString: string): Date | null {
    // Split the date string by '/' to get day, month, and year
    const parts = dateString.split('/');

    // Ensure the date has the correct format (DD/MM/YYYY)
    if (parts.length !== 3) {
      return null;  // Invalid format
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are zero-indexed in JavaScript (0 = January, 11 = December)
    const year = parseInt(parts[2], 10);

    // Return a new Date object, or null if the parsed date is invalid
    const parsedDate = new Date(year, month, day);

    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return null;  // Invalid date
    }

    return parsedDate;
  }




  processRegistrarData() {
    this.createAccountForm.personalInformation.firstName = this.registrarResponse.FirstName;
    this.createAccountForm.personalInformation.lastName = this.registrarResponse.Surname;
    this.createAccountForm.personalInformation.gender = this.processGender(this.registrarResponse.Sex)

    const dateString = this.registrarResponse.DateOfBirth; // e.g., "23/05/1973"
    const [day, month, year] = dateString.split("/").map(Number);
    this.dateOfBirthDisplay = new Date(year, month - 1, day);

    this.createAccountForm.personalInformation.dateOfBirth = this.registrarResponse.DateOfBirth;
    this.disableRegistrarInputs = true;
  }

  dateOfBirthDisplay?: any;

  // removeSpecialCharacters(str: any) {
  //   return str.replace(/[^a-zA-Z0-9\s]/g, '');
  // }

  removeSpecialCharacters(str: any) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }


  processGender(str: any) {
    if (str == 'M') {
      return 'Male'
    } else {
      return 'Female'
    }
  }

  subs = new SubscriptionsManager();

  registrarResponse?: any;
  disableRegistrarInputs: boolean = false;
  queryRegistrarLoader: boolean = false;

  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
  }

  startAccOpeningProcess: boolean = false;

  beginAccOpeningProcess() {
    this.startAccOpeningProcess = true;
    this.isVisible = false;
  }

  isTCAcknowledged = false;


  isAcknowledged = true;

  isVisible = true;
  isConfirmLoading = false;

  showModal(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    this.isConfirmLoading = true;
    setTimeout(() => {
      this.isVisible = false;
      this.isConfirmLoading = false;
    }, 1000);
  }

  handleCancel(): void {
    this.isVisible = false;
    this.navigateTo('home');
  }

  processIncomevsSlab() {
    return this.createAccountForm.employmentDetails.annualIncomeSlab > this.createAccountForm.employmentDetails.grossIncome;
  }

  normalizePhoneNumber(phone: string): string {
    return phone.replace(/^(\+?263|0)/, ''); // Remove +263, 263, or leading 0
  }

  current = 0;


  pre(): void {
    this.current -= 1;
  }

  async next() {
    if(this.current == 1) {
      const isValid = this.validateMobileNumber(this.createAccountForm.contactDetails.mobileNumber);
      if (!isValid) {
        this.notification.create('error', 'Error', 'The mobile number you entered is invalid')
        return; // Stop execution if mobile number is invalid
      }
      const isNextOfKinValid = this.validateMobileNumber(this.createAccountForm.contactDetails.contactPersonMobileNumber);
      if (!isNextOfKinValid) {
        this.notification.create('error', 'Error', 'The next of kin mobile number is invalid')
        return; // Stop execution if mobile number is invalid
      }
      if (
        this.normalizePhoneNumber(this.createAccountForm.contactDetails.mobileNumber) ===
        this.normalizePhoneNumber(this.createAccountForm.contactDetails.contactPersonMobileNumber)
      ) {
        this.notification.create('error', 'Error', 'Your phone number must be different from the next of kin phone number');
        return; // Stop execution if mobile number is invalid
      }
    }
    if(this.current == 2) {
      this.processAccountType();
      if (!this.processIncomevsSlab()) {
        this.notification.create('error', 'Error', 'Your annual income slab should be greater than your gross income')
        return;
      }
    }
    if(this.current == 3) {
      if(this.createAccountForm.employmentDetails.typeOfEmployment === 'Employed' && this.otherFileList.length == 0) {
        this.notification.create('error', 'Error', 'You need to upload your proof of income')
        return;
      } else{
        await this.uploadAttachments();
      }

    }
    this.current += 1;
    console.log(this.createAccountForm.employmentDetails)
  }

  createAccountLoader: boolean = false;

  done(): void {
    this.createAccountLoader = true;
    console.log('done');
    let newCreateAccountForm = {
      ...this.createAccountForm,
      contactDetails: {
        ...this.createAccountForm.contactDetails,
      },
      branch: this.createAccountForm.contactDetails.branch, // Move branch to top level
    };


    console.log(newCreateAccountForm);
    this.accountOpeningService.createNewRecord(newCreateAccountForm, 'account-opening');
  }

  isDoneVisible = false;

  handleDoneCancel(): void {
    this.isDoneVisible = false;
    this.navigateTo('home');
  }

  updateProfilePhotoFileList(fileList: NzUploadFile[]) {
    this.profilePhotoFileList = fileList; // Update the file list in the parent
    console.log(this.idFileList);
    console.log(this.profilePhotoFileList);
  }

  finishProfilePhotoCapture() {
    console.log("closing the window")
    this.handleFasCancel;
    this.isFasVisible = false;
  }

  idFileList: any[] = [];
  profilePhotoFileList: any[] = [];
  signatureFileList: any[] = [];
  proofOfResFileList: any[] = [];
  otherFileList: any[] = [];

  checkIdUploadFile = (file: NzUploadFile): boolean => {
    this.idFileList = this.idFileList.concat(file);
    return false;
  }

  checkSignatureUploadFile = (file: NzUploadFile): boolean => {
    this.signatureFileList = this.signatureFileList.concat(file);
    return false;
  }

  checkProofUploadFile = (file: NzUploadFile): boolean => {
    this.proofOfResFileList = this.proofOfResFileList.concat(file);
    return false;
  }

  checkOtherUploadFile = (file: NzUploadFile): boolean => {
    this.otherFileList = this.otherFileList.concat(file);
    return false;
  }


  async uploadAttachments() {
    console.log(this.idFileList);
    console.log(this.profilePhotoFileList)

    try {
      const idDocs = await this.processUpload(this.idFileList);
      const profileDocs = await this.processUpload(this.profilePhotoFileList);
      const signatureDocs = await this.processUpload(this.signatureFileList);
      const proofOfResDocs = await this.processUpload(this.proofOfResFileList);
      const otherDocs = await this.processUpload(this.otherFileList);

      this.createAccountForm.documents.id = idDocs.length > 0 ? idDocs[0].id : ''; // Extract first item as string
      this.createAccountForm.documents.profile = profileDocs.length > 0 ? profileDocs[0].id : '';
      this.createAccountForm.documents.signature = signatureDocs.length > 0 ? signatureDocs[0].id : '';
      this.createAccountForm.documents.proofOfRes = proofOfResDocs.length > 0 ? proofOfResDocs[0].id : '';
      this.createAccountForm.documents.otherDocuments = otherDocs.map((item) => item.id); // Keep as an array

      console.log("-------------------");
      console.log(this.createAccountForm.documents);
      this.documentsUploadDone = true;
    } catch (error) {
      console.error("Error uploading attachments:", error);
    }
  }

  documentsUploadDone: boolean = false;

  cancelAccountOpening(){
    this.navigateTo('home');
  }





  processUpload(fileList: any): Promise<any[]> {
    const uploadPromises: Promise<any>[] = [];

    fileList.forEach((file: any) => {
      const formData: FormData = new FormData();
      formData.append("files", file);
      formData.append("owner", "SelfService");
      formData.append("operation", "UPLOAD");
      formData.append("path", "account-opening, " + this.createAccountForm.personalInformation.pidNumber);
      // formData.append("data", "");
      formData.append("temporary", "false");
      formData.append("namePrefix", this.createAccountForm.personalInformation.pidNumber);

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



  completeUploadPromises(uploadPromises: any) {
    // Wait for all uploads to complete
    Promise.all(uploadPromises)
      .then(() => {
        console.log('All uploads complete.');

        // Proceed with the rest of the logic
        console.log("Upload job completed")
      })
      .catch((error) => {
        console.error('Error in one or more uploads:', error);
      });
  }

  selectedValue = null;
  firstName: string = '';
  middleName: string = '';
  lastName: string = '';

  // getRegistrarData() {
  //   this.createAccountForm.personalInformation.pidNumber = this.removeSpecialCharacters(this.createAccountForm.personalInformation.pidNumber)
  //   this.queryRegistrarLoader = true;
  //   this.accountOpeningService.queryRegistrar(this.removeSpecialCharacters(this.createAccountForm.personalInformation.pidNumber));
  // }

  getRegistrarData() {
    if (MOCK_REGISTRAR) {
      this.onMockRegistrar()
    } else {
        this.createAccountForm.personalInformation.pidNumber = this.removeSpecialCharacters(this.createAccountForm.personalInformation.pidNumber)
        this.queryRegistrarLoader = true;
        this.accountOpeningService.queryRegistrar(this.removeSpecialCharacters(this.createAccountForm.personalInformation.pidNumber));
    }
  }

  onMockRegistrar() {

    let res = {
      Status: "A",
      Surname: "DOE",
      FirstName: "JOHN",
      Sex: "M",
      DateOfBirth: "10/11/1984",
      DateOfDeath: "",
      BirthPlace: "Checheche",
      NationalId: "63159352K23"
    }

    // Assuming dateOfBirth is a string in the format 'YYYY-MM-DD' (adjust if necessary)
    const dateOfBirth = this.parseDate(res.DateOfBirth);  // Convert to Date object
    // const dateOfBirth = this.parseDate("23/05/2010");  // Convert to Date object
    console.log('Date of birth:', res.DateOfBirth);
    console.log('Date of birth:', dateOfBirth);

    if(res.Sex == 'M') {
      console.log("MALE")
      this.title = [...this.title, "MR"];
    }
    if(res.Sex == 'F') {
      console.log("FEMALE")
      this.title = [...this.title, "MRS", "MISS", "MS"];
    }



    if (!dateOfBirth) {
      this.notification.create('error', 'Error', 'Invalid date of birth');
      return;
    }

    // Calculate age
    const age = this.calculateAge(dateOfBirth);
    console.log('Age:', age);

    // If age is less than 18, prevent them from proceeding
    if (age < 18) {
      this.queryRegistrarLoader = false;
      this.isAgeVisible = true;
      return;  // Stop further execution
    }

    // Proceed with registration if age is 18 or older
    this.registrarResponse = res;
    this.applicationState.registrarData = true;
    this.processRegistrarData();
    this.queryRegistrarLoader = false;
  }

  disabledDate = (current: Date): boolean =>
    current <= this.convertToDate(this.createAccountForm.personalInformation.dateOfBirth) || current > new Date();

  disabledYear (current: Date): boolean {
    let today = new Date();
      return current > today
  }

  validateMobileNumber(mobile: string): boolean {
    const mobileNumberRegex = /^(2637\d{8}|07\d{8})$/;
    return mobileNumberRegex.test(mobile);
  }





  convertToDate(dateString: string): Date {
    if (!dateString) return new Date(); // Fallback to today if input is empty

    const parts = dateString.split('/'); // Splitting "DD/MM/YYYY"
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-based (0 = Jan, 11 = Dec)
      const year = parseInt(parts[2], 10);

      return new Date(year, month, day);
    }

    return new Date(); // Fallback in case of an incorrect format
  }


  applicationState = {
    sectionStates: {
      identification: false,
      personalDetails: false,
      contactDetails: false,
      address: false,
    },
    registrarData: false,
  };

  createAccountForm = {
    personalInformation: {
      pidType: 'ID',
      pidNumber: '',
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      primaryNationality: 'Zimbabwe',
      maritalStatus: '',
      pidDateOfIssue: ''
    },
    contactDetails: {
      mobileNumber: '',
      emailAddress: '',
      branch: '',
      addressType: '',
      addressLine1: '',
      streetAddress: '',
      city: '',
      country: 'Zimbabwe',
      stayingSince: '',
      preferSms: true,
      useAsPermanentAddress: false,
      preferredMethodOfContact: '',
      allowSmsAlerts: '',
      contactPerson: '',
      nextOfKinAddress: '',
      contactPersonMobileNumber: '',
    },
    employmentDetails: {
      lineOfActivity: '',
      occupation: '',
      annualIncomeSlab: '',
      sourceOfFunds: '',
      dependents: '',
      currency: '',
      grossIncome: '',
      otherSourceOfIncome: '',
      productCode: 'Current Individual',
      accountType: '',
      accountSubType: 'Current account Individual',
      typeOfEmployment: '',
    },
    documents: {
      id: '',
      profile: '',
      signature: '',
      proofOfRes: '',
      otherDocuments: [] as string[],
    },
  };

  // processAccountType() {
  //   if (this.createAccountForm.employmentDetails.currency == 'ZWG') {
  //       this.createAccountForm.employmentDetails.accountType = 'CAI - ZiG CAI'
  //   }
  //   if (this.createAccountForm.employmentDetails.currency == 'USD') {
  //     this.createAccountForm.employmentDetails.accountType = 'FXCAI - FCA CAI'
  // }
  // }

  processAccountType() {
    const currency = this.createAccountForm.employmentDetails.currency;

    // default values
    let productCode = '';
    let accountTypeCode = '';
    let accountSubType = '';

    if (currency === 'ZWG' && this.selectedProductCode === 'Current Account') {
      // Mapping 1
      productCode = 'Current Individual';
      accountTypeCode = 'CAI- ZIG CAI';
      accountSubType = 'Current Individual';
    } else if ((currency === 'USD' || currency === 'ZAR') && this.selectedProductCode === 'Current Account') {
      // Mapping 2
      productCode = 'FCA Current Individual';
      accountTypeCode = 'FXCAI- FCA CAI';
      accountSubType = 'Current Account Individual';
    } else if (currency === 'ZWG' && this.selectedProductCode === 'Savings Account') {
      // Mapping 3
      productCode = 'Savings Account Individual';
      accountTypeCode = 'SAI- SAI';
      accountSubType = 'Savings Account Individual';
    } else if ((currency === 'USD' || currency === 'ZAR') && this.selectedProductCode === 'Savings Account') {
      // Mapping 4
      productCode = 'FCA Savings Account Individual';
      accountTypeCode = 'FCSAI- FCA SAI';
      accountSubType = 'FCA Individual Savings Account';
    } else if (currency === 'ZWG' && this.selectedProductCode === 'Low Cost Account') {
      // Mapping 5
      productCode = 'Current Individual';
      accountTypeCode = 'CAI- ZIG CAI';
      accountSubType = 'Individual Low Cost';
    } else if ((currency === 'USD' || currency === 'ZAR') && this.selectedProductCode === 'Low Cost Account') {
      // Mapping 6
      productCode = 'FCA Current Individual';
      accountTypeCode = 'FXCAI- FCA CAI';
      accountSubType = 'FX Individual Low Cost Account';
    } else if (currency === 'ZWG & USD' ) {
      productCode = this.selectedProductCode
    }

    // assign back to form (note: accountType will now hold the code string)
    this.createAccountForm.employmentDetails.productCode = productCode;
    this.createAccountForm.employmentDetails.accountType = accountTypeCode;
    this.createAccountForm.employmentDetails.accountSubType = accountSubType;
  }


  selectedProductCode?: any;

  accountTypes = [
    "Current Account",
    "Savings Account",
    "Low Cost Account"
  ]

  maritalStatusOptions: string[] = [
    "MARRIED",
    "DIVORCED",
    "SINGLE",
    "WIDOWED"
  ];

  branches = [
    // 'HEAD OFFICE',
    '8th Avenue Branch Byo',
'BINDURA',
'Binga',
// 'Card Centre',
// 'Central Cash Depot BYO',
// 'Central Operations',
'Checheche',
'Chegutu',
// 'Debt Recovery',
'Chinhoyi',
'Chipinge',
'Chiredzi',
'CHIVI',
// 'Corporate Banking',
// 'Executive Banking',
'Filabusi',
'Gokwe',
'Guruve',
'Gutu',
'Gwanda',
'Gweru',
'Hwange',
'Inala Hse Bulawayo',
'Jason Moyo Ave Bulawayo',
'Jerera',
'Karoi',
'Kopje Harare',
'Kotwa',
'Lupane',
'Magunje',
'Maphisa',
'Marondera',
'Masvingo',
'Mataga',
'Mt Darwin',
'Mubaira',
'Murambinda',
'Murehwa',
'Mutare',
'Mutoko',
'Mvurwi',
'Nelson Mandela Ave',
'Norton',
'Nyanga',
'Nyika',
'Rusape',
'Rushinga',
// 'Sanyati',
// 'Treasury',
'Wedza',
'Westgate',
'Zvishavane',
// 'Salary Processing',
// 'MICROFINANCE HQ',
// 'MICROFINANCE BINDURA',
// 'MICROFINANCE BINGA',
// 'MICROFINANCE CHIBUWE',
// 'MICROFINANCE CHIREDZI',
// 'MICROFINANCE FILABUSI',
// 'MICROFINANCE GOKWE',
// 'MICROFINANCE GURUVE',
// 'MICROFINANCE GWANDA',
// 'MICROFINANCE KAROI',
// 'MICROFINANCE MAPHISA',
// 'MICROFINANCE MARONDERA',
// 'MICROFINANCE MUTARE',
// 'MICROFINANCE MUTOKO',
// 'MICROFINANCE NELSON',
// 'MICROFINANCE NORTON',
// 'MICROFINANCE KOPJE',
// 'MICROFINANCE SANYATI',
// 'MICROFINANCE WESTGATE',
// 'MICROFINANCE EIGHTH',
// 'MICROFINANCE ZVISHA',
// 'Land Bank HQ',
// 'Land Bank Chinhoyi',
// 'Land Bank Marondera',
// 'Land Bank Mutare',
// 'Land Bank Bindura',
// 'Land Bank Masvingo',
// 'Land Bank Gweru',
// 'Land Bank Jason Moyo',
// 'Land Bank Gwanda',
// 'Land Bank Harare'
  ];

  gender = [
    'Male',
    'Female'
  ]

  title = [
    "DR",
    "REV"
  ]

  // TODO clean up occupation

  occupation = [
    "AccountingAndFinance",
    "VicePresiden",
    "VariousTechnIntermeProfession",
    "WardAttendan",
    "WorkersAndFarmLaborer",
    "WorkersAndFishingLaborer",
    "WholesaleOrSemiWholesal",
    "AirAndSeaTransportTechnicians",
    "Accountant",
    "AdministrativeOfficer",
    "AdministrativeEmployees",
    "AgricFarmForestTechnicians",
    "AssistantManager",
    "Architect",
    "ArmedForces",
    "Artist",
    "Artisan",
    "AirTransportPersonnel",
    "Auditor",
    "BusinessAndFinancialExecutives",
    "BankClerk",
    "BlueCollarWorker",
    "BoardMember",
    "BranchManager",
    "BankOfficer",
    "Banker",
    "Broker",
    "BusinessAnalyst",
    "CarpentryAndCraftsman",
    "ComputerAnalystProgrammer",
    "CommercialEmployees",
    "CivilEngineer",
    "ChiefExecutiveOfficer",
    "CorporateExecutives",
    "CommFinIntermediaries",
    "ChiefFinancialOfficer",
    "CIO_ChiefInformationOfficer",
    "CraftsLaborers",
    "ChiefMedicalExecutive",
    "Computer",
    "Consultant",
    "DatabaseAdministrator",
    "CivilOrPublicServant",
    "ClericalOfficer",
    "ControlRoomOperator",
    "ComputerSystemsEngineer",
    "CustomerService",
    "Director",
    "DeputyCEO",
    "Designer",
    "DirectorGeneral",
    "DriversHeavyEquip",
    "Directors",
    "Distributor",
    "DriversOfMachinesAndAssemblers",
    "Driver",
    "EntertainmentAndFineArtsArtists",
    "Economist",
    "ElectrElectronTelcoTechnicians",
    "EmployeesHotelCaterEtc",
    "EmployeesInReligiousInstitutions",
    "EducInstResponsibles",
    "ElectricalEngineer",
    "Engineer",
    "EmployeesNotClassifiedOtherwise",
    "Enterpreneur",
    "EmployeesPersDomServices",
    "ExeReligInstitutions",
    "EstateOfficer",
    "Executive",
    "FinancialAnalyst",
    "FishermenAndFarmersAssimilated",
    "ForestAndHuntingPersonnel",
    "ForestAndAssimilatedOperator",
    "Fisherman",
    "FinanceManager",
    "FinanceOfficer",
    "FarmOperators",
    "Foreman",
    "Farmer",
    "GovernmentOfficer",
    "HospitalityAndRestaurant",
    "HealthAndSocialTechnicians",
    "HealthManagers",
    "HeadOfCorporateDivision",
    "HeadsOfFunctionsOrExecutives",
    "HeadOfOperations",
    "HumanResourceOfficer",
    "InternalAuditor",
    "IndustrialTechnicians",
    "InsuranceOfficer",
    "InvestmentAdvisor",
    "InstalOperatorFixEquipEtc",
    "InfSciCommunicationsSpecialist",
    "ITSecurityAdministrator",
    "ITTechnician",
    "InformalWorker",
    "Judge",
    "KitchenAttendant",
    "LaboratoryTechnician",
    "LocalAdministrationManagers",
    "LawyerAndPublicNotary",
    "Librarian",
    "Liquidator",
    "LegalOfficer",
    "LegalProfessionals",
    "LandTransportPersonnel",
    "Lawyer",
    "ManeuversAndHandlersConstruction",
    "ManeuversAndHandlersIndustries",
    "ManeuversAndHandlersMines",
    "Manager",
    "Marketing",
    "ManeuversCrafts",
    "MedicalDoctor",
    "Merchant",
    "Messenger",
    "MiddleManager",
    "Military",
    "Minister",
    "ManualIndustryWorker",
    "MarketingManager",
    "ManeuveringNationalProm",
    "MedicalOfficer",
    "MemberOfParliament",
    "MidPositionsCommSocialArt",
    "MidPositionsAdmLegal",
    "NonProfitOrganizationsManagers",
    "Nurse",
    "OrganizationalAnalyst",
    "OrganizationLeader",
    "OfficeManager",
    "OperationManager",
    "OtherSkilledPersonnel",
    "Other",
    "PublicAdministration",
    "ProgrammeCoordinator",
    "ProductionManager",
    "PrincipalDirectors",
    "PersonnelManager",
    "PharmaceuticalAssistan",
    ">Pharmacist",
    "ProfessorsHigherEducation",
    "ProjectManager",
    "PurchasingManager",
    "Pensioner",
    "Policeman",
    "PlanningOfficer",
    "PersonnelOfSecurityServices",
    "PublicRelationsAssistant",
    "President",
    "PublicRelationsManager",
    "Professor",
    "PermanentSecretary",
    "PublicServiceManagers",
    "PersonalSecretary",
    "ProfTeachersBasicEducation",
    "PublicRelationsOfficer",
    "RegistryAssistant",
    "Rancher",
    "Receptionist",
    "Researcher",
    "Retailers",
    "RecordsManagementOfficer",
    "SpecialAssignments",
    "ScienceAndTechnicsExecutives",
    "SocialAffairs",
    "ShopsAndServicesLaborers",
    "SocialAndHumanScienceSpecialists",
    "SecurityOfficer",
    "ServicePersonnel",
    "SecurityGuard",
    "Shareholder",
    "SalesManager",
    "ServiceManager",
    "SuppliesOfficer",
    "SkilledPersonnelAgriculture",
    "SkilledPersonnelTobacBev",
    "SkilledPersonnelInConstructuion",
    "SkilledPersonnelCraftsPrinting",
    "SkilledPersonnelInCarpentry",
    "SkilledPersonnelInElectrics",
    "SkilledPersonnelInMining",
    "SkilledPersonnelInProduction",
    "SkilledPersonnelInTextiles",
    "SeniorManager",
    "Statistician",
    "StoreManager",
    "SeaTransportPersonnel",
    "Supervisor",
    "Teacher",
    "TechnicianEngineer",
    "TheHandlersManeuversAndTransport",
    "TransportationManager",
    "TelephoneOperator",
    "TransportOfficer",
    "TechnicalSupervisor"
  ]

  city = [
    "Harare",
    "Ruwa",
    "Norton",
    "Arcturus",
    "Beatrice",
    "Birchenough Bridge",
    "Checheche",
    "Chimanimani",
    "Chipangayi",
    "Chipinge",
    "Mutare",
    "Penhalonga",
    "Odzi",
    "Hauna",
    "Juliasdale",
    "Nyanga",
    "Murambinda",
    "Nyazura",
    "Headlands",
    "Rusape",
    "Bindura",
    "Centenary",
    "Concession",
    "Glendale",
    "Mazowe",
    "Christon Bank",
    "Mount Darwin",
    "Mvurwi",
    "Guruve",
    "Shamva",
    "Darwendale",
    "Raffingora",
    "Mutorashanga",
    "Trelawney",
    "Chinhoyi",
    "Murombedzi",
    "Mhangura",
    "Banket",
    "Kariba",
    "Karoi",
    "Makuti",
    "Chirundu",
    "Kadoma",
    "Chegutu",
    "Chakari",
    "Sanyati",
    "Selous",
    "Macheke",
    "Wedza",
    "Murewa",
    "Mutoko",
    "Masvingo",
    "Jerera",
    "Nyaningwe",
    "Mataga",
    "Mberengwa",
    "Gutu",
    "Mashava",
    "Nyika",
    "Zvishavane",
    "Chatsworth",
    "Chiredzi",
    "Triangle",
    "Rutenga",
    "Ngundu",
    "Bulawayo",
    "Tsholotsho",
    "Nyamandlovu",
    "Turkmine",
    "Shangani",
    "Esigodini",
    "Aobab",
    "Binga",
    "Dete",
    "Hwange",
    "Jotsholo",
    "Lupane",
    "Victoria Falls",
    "Beitbridge",
    "Figtree",
    "Kezi",
    "Matopos",
    "Plumtree",
    "Filabusi",
    "Collen Bawn",
    "Gwanda",
    "West Nicholson",
    "Gweru",
    "Shurugwi",
    "Mvuma",
    "Lalapanzi",
    "Chivhu",
    "Kwekwe",
    "Redcliff",
    "Battle Fields",
    "Gokwe",
    "Nkayi",
    "Munyati",
    "Marondera",
    "Rushinga",
    "Mubaira",
    "MAPISA",
    "CHITUNGWIZA",
    "MAGUNJE",
    "KOTWA",
  ]

  lineOfActivity = [
    'Agriculture',
    'Transport',
    'Finance',
    'Public service',
    'Mining',
    'Construction',
    'TeleCommunications',
    'Tourism and Hospitality',
    'Health',
    'Manufacturing',
    'Services',
    'Information Communications Technology',
    'Energy',
    'Retail and distribution',
    'Entertainment',
    'Sports and Recreation',
    'Other',
    // 'Suspense'
  ]

  sourceOfFunds = [
    "Allotment or Pension",
    "Salary",
    "Maintenance",
    "Purely Business Income",
    "Allowances",
    "Rental",
    "Remittance",
    "Commissons",
    "Other",
    "Trading",
    "Donations",
    "Free Funds",
    "Inheritance",
    "Investments",
    "Shares",
    "Dividends",
    "Property sales",
    "Compensation from legal rulings",
    "Personal savings",
    "Loans",
    "Reimbursements",
    "Insurance payouts",
    "Gambling",
    "Grants"
  ]

  typeOfEmployment = [
    "Employed",
    "Not Employed",
    "Self Employed / Own Business",
  ]

  currency = [
    "ZWG",
    "USD",
    "ZWG & USD",
    "ZAR"
  ]

  countries = countries;

  checkInformation(
    jsonSection: keyof typeof this.createAccountForm,
    excludedPages: any,
  ): boolean {
    const section = this.createAccountForm[jsonSection];

    let result = !Object.entries(section)
  .filter(([key]) => !excludedPages.includes(key)) // Exclude specific keys
  .map(([, value]) => value)
  .some(value => value === '' || value === null); // Check for empty string or null

    return result;
  }

  checkDocuments(): boolean {
    const fileLists = [
      this.idFileList,
      this.profilePhotoFileList,
      this.signatureFileList,
      this.proofOfResFileList
    ];

    return fileLists.every(list => list.length > 0);
  }

  openFasModal() {
    console.log('FAS Activated');
    this.isFasVisible = true;
  }

  isFasVisible = false;

  handleFasCancel(): void {
    this.isFasVisible = false;
  }


  isAgeVisible = false;


  handleAgeCancel(): void {
    this.isAgeVisible = false;
    this.navigateTo('home');
  }

  isLeaveVisible = false;

  openLeavePageModal() {
    this.isLeaveVisible = true;
  }


  handleLeaveCancel(): void {
    this.isLeaveVisible = false;
    this.navigateTo('home');
  }

  tcVisible = false;

  open(): void {
    this.tcVisible = true;
  }

  close(): void {
    this.tcVisible = false;
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
