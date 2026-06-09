import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SubscriptionsManager } from '../../../../core/helpers/SubscriptionsManager';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzDrawerSize } from 'ng-zorro-antd/drawer';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { RoutingService } from '../../../../core/services/routing.service';
import { AccountOpeningService } from '../../services/account-opening.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {InsuranceService} from "../../services/insurance.service";

@Component({
  selector: 'app-insurance-application',
  templateUrl: './insurance-application.component.html',
  styleUrl: './insurance-application.component.scss'
})
export class InsuranceApplicationComponent implements OnInit, OnDestroy {

  constructor(
      private routingService: RoutingService,
      private accountOpeningService: AccountOpeningService,
      private notification: NzNotificationService,
      private cdr: ChangeDetectorRef,
      private breakpointObserver: BreakpointObserver,
      private insuranceService: InsuranceService,
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

  ngOnInit(): void {
    this.getRiskClasses();
    this.subs.add = this.accountOpeningService.queryRegistrarResponse$.subscribe((res: any) => {
      this.onQueryRegistrarResponse(res);
    });

    this.subs.add = this.insuranceService.generateQuotationResponse$.subscribe((res: any) => {
      this.onGenerateQuotationResponse(res);
    });

    this.subs.add = this.insuranceService.getRiskClassesResponse$.subscribe((res: any) => {
      this.onGetRiskClassesResponse(res);
    });

    this.subs.add = this.insuranceService.acceptQuotationResponse$.subscribe((res: any) => {
      this.onAcceptQuotationResponse(res);
    });
  }

  onGetRiskClassesResponse(res: any) {
    console.log(res)
    if (res.success) {
      this.riskClasses = res.data;
    } else {
      this.notification.create('error', 'Error', 'Failed to process request');
    }
    this.getRiskClassesLoader = false;
  }

  generateQuotationResponse?: any;
  currentDate = new Date();

  onGenerateQuotationResponse(res: any) {
    console.log(res)
    if (res.success) {
      this.generateQuotationResponse = res.data
    } else {
      this.notification.create('error', 'Error', 'Failed to process request');
    }
    this.generateQuotationLoader = false;
  }

  onAcceptQuotationResponse(res: any) {
    console.log(res);
    if (res.success) {
      this.notification.create('success', 'Success', res.message);
      this.navigateTo('home');

    } else {
      this.notification.create('error', 'Error', 'Request failed');
    }
    this.acceptQuotationLoader = false;
  }


  savedTicketNumber?: any;

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

  subs = new SubscriptionsManager();

  // Terms and Conditions
  isTCAcknowledged = false;
  startInsuranceApplicationProcess: boolean = false;
  isAcknowledged = true;

  beginInsuranceApplicationProcess() {
    this.startInsuranceApplicationProcess = true;
    this.isVisible = false;
  }

  isVisible = true;

  showModal(): void {
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
    this.navigateTo('home');
  }

  tcVisible = false;
  drawerSize: NzDrawerSize = 'large'; // Default size

  open(): void {
    this.tcVisible = true;
  }

  close(): void {
    this.tcVisible = false;
  }

  riskClasses?: any;
  getRiskClassesLoader: boolean = false;
  getRiskClasses() {
    console.log("Fetching Risk Classes");
    this.getRiskClassesLoader = true;
    this.insuranceService.getRiskClasses();
  }

  // Insurance Application

  insuranceApplicationForm = {
    personalInformation: {
      status: '',
      surname: '',
      firstName: '',
      sex: '',
      nationalId: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: '',
      customerType: ''
    },
    productInformation: {
      periodOfCover: '',
      riskClassId: '',
      description: '',
      sumInsured: '',
      registrationNumber: '',
      riskClass: {} as any,
    }
  };

  formatForQuotaionGeneration(){
    console.log(this.insuranceApplicationForm)
    let request = {
      customerDto: {
        registrar: {
          status: this.insuranceApplicationForm.personalInformation.status,
          surname: this.insuranceApplicationForm.personalInformation.surname,
          firstName: this.insuranceApplicationForm.personalInformation.firstName,
          sex: this.insuranceApplicationForm.personalInformation.sex,
          nationalId: this.insuranceApplicationForm.personalInformation.nationalId,
          dateOfBirth: this.formatDateSlash(this.insuranceApplicationForm.personalInformation.dateOfBirth)
        },

        email: this.insuranceApplicationForm.personalInformation.email,
        phone: this.insuranceApplicationForm.personalInformation.phone,
        address: this.insuranceApplicationForm.personalInformation.address,
        customerType: this.insuranceApplicationForm.personalInformation.customerType
      },
      policyDto: {
        periodOfCover: this.insuranceApplicationForm.productInformation.periodOfCover,
        riskClassId: this.insuranceApplicationForm.productInformation.riskClass.id
      },
      insuredItemsDtoList: [
        {
          description: this.insuranceApplicationForm.productInformation.description,
          registrationNumber: this.insuranceApplicationForm.productInformation.registrationNumber,
          sumInsured: this.insuranceApplicationForm.productInformation.sumInsured,
          riskClass: this.insuranceApplicationForm.productInformation.riskClass.riskClassName
        }
      ],
      riskClassId: this.insuranceApplicationForm.productInformation.riskClass.id
    }

    console.log(request);
    return request;
  }

  formatDate(req: any){
    return req?.toISOString().split('T')[0];
  }

  formatDateSlash(input: string): string {
    const date = new Date(input.replace(/\//g, '-')); // Normalize input for Date parsing
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  generateQuotationLoader: boolean = false;
  generateQuotation(req: any){
    this.generateQuotationLoader = true;
    this.insuranceService.generateQuotation(req)
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

  maritalStatusOptions: string[] = [
    "MARRIED",
    "DIVORCED",
    "SINGLE",
    "WIDOWED"
  ];

  periodOfCover: string[] = [
    "3",
    "6",
    "9",
    "12"
  ];

  customerType: string[] = [
    "Individual"
  ];

  current = 0;


  pre(): void {
    this.current -= 1;
  }

  next(): void {
    if(this.current == 0) {
      const isValid = this.validateMobileNumber(this.insuranceApplicationForm.personalInformation.phone);
      if (!isValid) {
        this.notification.create('error', 'Error', 'The mobile number you entered is invalid')
        return; // Stop execution if mobile number is invalid
      }
    }
    if(this.current == 1) {
      let request = this.formatForQuotaionGeneration();
      this.generateQuotation(request);
    }
    if(this.current == 3) {
        this.uploadAttachments();
    }
    this.current += 1;
  }

  acceptQuotationLoader: boolean = false;

  done(): void {
    this.acceptQuotationLoader = true;
    console.log(this.insuranceApplicationForm);
    this.insuranceService.acceptQuotation(this.generateQuotationResponse.id)
  }

  isDoneVisible = false;

  // Registrar Data
  registrarResponse?: any;
  disableRegistrarInputs: boolean = false;
  queryRegistrarLoader: boolean = false;

  getRegistrarData() {
    // if (MOCK_REGISTRAR) {
    //   this.onMockRegistrar()
    // } else {
      this.insuranceApplicationForm.personalInformation.nationalId = this.removeSpecialCharacters(this.insuranceApplicationForm.personalInformation.nationalId)
      this.queryRegistrarLoader = true;
      this.accountOpeningService.queryRegistrar(this.removeSpecialCharacters(this.insuranceApplicationForm.personalInformation.nationalId));
    // }
  }

  processRegistrarData() {
    this.insuranceApplicationForm.personalInformation.firstName = this.registrarResponse.FirstName;
    this.insuranceApplicationForm.personalInformation.surname = this.registrarResponse.Surname;
    this.insuranceApplicationForm.personalInformation.sex = this.processGender(this.registrarResponse.Sex)

    const dateString = this.registrarResponse.DateOfBirth; // e.g., "23/05/1973"
    const [day, month, year] = dateString.split("/").map(Number);
    this.dateOfBirthDisplay = new Date(year, month - 1, day);

    this.insuranceApplicationForm.personalInformation.dateOfBirth = this.registrarResponse.DateOfBirth;
    this.disableRegistrarInputs = true;
  }

  restartEntries() {
    Object.keys(this.insuranceApplicationForm.personalInformation).forEach(
      key => this.insuranceApplicationForm.personalInformation[key as keyof typeof this.insuranceApplicationForm.personalInformation] = ''
    );
    this.applicationState.registrarData = false;
  }

  dateOfBirthDisplay?: any;

  checkInformation(
    jsonSection: keyof typeof this.insuranceApplicationForm,
    excludedPages: any,
  ): boolean {
    const section = this.insuranceApplicationForm[jsonSection];

    let result = !Object.entries(section)
  .filter(([key]) => !excludedPages.includes(key)) // Exclude specific keys
  .map(([, value]) => value)
  .some(value => value === '' || value === null); // Check for empty string or null

    return result;
  }

  checkDocuments(): boolean {
    const fileLists = [
      this.productFileList,
    ];

    return fileLists.every(list => list.length > 0);
  }

    productFileList: any[] = [];

    checkProductUploadFile = (file: NzUploadFile): boolean => {
      this.productFileList = this.productFileList.concat(file);
      return false;
    }

  // Leave Application
  isLeaveVisible = false;

  openLeavePageModal() {
    this.isLeaveVisible = true;
  }


  handleLeaveCancel(): void {
    this.isLeaveVisible = false;
    this.navigateTo('home');
  }

  isAgeVisible = false;


  handleAgeCancel(): void {
    this.isAgeVisible = false;
    this.navigateTo('home');
  }

  // Uploads
  async uploadAttachments() {
    console.log(this.productFileList);

    try {
      const productDocs = await this.processUpload(this.productFileList);
      // this.insuranceApplicationForm.productInformation.productImages = productDocs.map((item) => item.id);

      console.log("-------------------");
      console.log(this.insuranceApplicationForm.productInformation);
    } catch (error) {
      console.error("Error uploading attachments:", error);
    }
  }

  processUpload(fileList: any): Promise<any[]> {
    const uploadPromises: Promise<any>[] = [];

    fileList.forEach((file: any) => {
      const formData: FormData = new FormData();
      formData.append("files", file);
      formData.append("service", "ACCOUNT-OPEN");
      formData.append("temporary", "false");

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


  // Miscellaneous Functions
  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
  }

  removeSpecialCharacters(str: any) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  }

  validateMobileNumber(mobile: string): boolean {
    const mobileNumberRegex = /^(2637\d{8}|07\d{8})$/;
    return mobileNumberRegex.test(mobile);
  }

  normalizePhoneNumber(phone: string): string {
    return phone.replace(/^(\+?263|0)/, ''); // Remove +263, 263, or leading 0
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

  processGender(str: any) {
    if (str == 'M') {
      return 'Male'
    } else {
      return 'Female'
    }
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

  // Data
  title = [
    "DR",
    "REV"
  ]

  gender = [
    'Male',
    'Female'
  ]

  ngOnDestroy(): void {
    this.subs.dispose();
  }
}
