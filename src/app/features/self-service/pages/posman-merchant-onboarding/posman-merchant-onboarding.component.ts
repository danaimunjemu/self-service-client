import {Component, OnInit, signal} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {PosmanMerchantOnboarding} from "./posman-merchant-onboarding";
import {NgForOf} from "@angular/common";
import {NzOptionComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {PosmanMerchantOnboardingService} from "../../services/posman-merchant-onboarding.service";
import {SharedModule} from "../../../shared/shared.module";
import {AccountOpeningService} from "../../services/account-opening.service";
import {NzNotificationService} from "ng-zorro-antd/notification";
import {SubscriptionsManager} from "../../../../core/helpers/SubscriptionsManager";
import {NzUploadComponent, NzUploadFile} from "ng-zorro-antd/upload";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzPopconfirmDirective} from "ng-zorro-antd/popconfirm";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzModalComponent} from "ng-zorro-antd/modal";
import {RoutingService} from "../../../../core/services/routing.service";

@Component({
  selector: 'app-posman-merchant-onboarding',
  imports: [
    FormsModule,
    NgForOf,
    NzOptionComponent,
    NzSelectComponent,
    SharedModule,
    NzUploadComponent,
    NzButtonComponent,
    NzPopconfirmDirective,
    NzTooltipDirective,
    NzModalComponent
  ],
  templateUrl: './posman-merchant-onboarding.component.html',
  standalone: true,
  styleUrl: './posman-merchant-onboarding.component.scss'
})
export class PosmanMerchantOnboardingComponent implements OnInit{

  pos = signal(new PosmanMerchantOnboarding());

  selectedFile: File | null = null;

  constructor(private posRequestService: PosmanMerchantOnboardingService,
              private router: Router,
              private accountOpeningService: AccountOpeningService,
              private notification: NzNotificationService,
              private route: ActivatedRoute,
              private routingService: RoutingService,
              ) {
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('File selected:', file.name);
    }
  }

  savePosRequest(){

  }

  cancel() {
    this.router.navigate(['../home'], { relativeTo: this.route });
  }

  isLeaveVisible = false;

  openLeavePageModal() {
    this.isLeaveVisible = true;
  }

  onSubmit(){
    console.log(this.pos());
    this.savePosRequest()

  }

  onCreateNewRecordResponse(res: any) {
    this.createAccountLoader = false;

    console.log('server response', res)

    const successId = res?.data?.id ||
      res?.id ||
      res?.data?.ticketId ||
      res?.ticketId ||
      res?.data?.reference ||
      res?.reference;
    const isSuccessFlag = res?.success === true || res?.status === 'SUCCESS' || res?.message === 'Success';

    if (successId || isSuccessFlag) {
      this.notification.create('success', 'Success', 'Request submitted successfully');
      this.savedTicketNumber = successId || 'Submitted';
      this.savedTicketNumber = res.data.ticketId;
      this.isDoneVisible = true;
      // Optional: this.router.navigate(['/success']);
    } else {

      const serverError = res?.message || res?.error || 'Submission failed. Please check your details.';
      this.notification.create('error', 'Error', serverError);
      // Check for success flag if no ID is present
      // if (res?.success) {
      //   this.notification.create('success', 'Success', 'Request submitted successfully');
      // } else {
      //   this.notification.create('error', 'Error', 'Submission failed. Please check your details.');
      // }
    }
  }

  createAccountLoader: boolean = false;
  savedTicketNumber?: any;


  ngOnInit(): void {
    this.getBranches();
    this.getMcc();
    this.subs.add = this.accountOpeningService.createNewRecordResponse$.subscribe((res: any) => {
      this.onCreateNewRecordResponse(res);
    });
    this.subs.add = this.accountOpeningService.getBranchesResponse$.subscribe((res: any) => {
      this.onGetBranchesResponse(res);
    });
    this.subs.add = this.accountOpeningService.getMccResponse$.subscribe((res: any) => {
      this.onGetMccResponse(res);
    });
  }

  subs = new SubscriptionsManager();

  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
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

  getMccLoader: boolean = false;
  getMcc() {
    this.getMccLoader = true;
    this.accountOpeningService.getMcc();
  }

  onGetMccResponse(res: any){
    console.log('MCC raw response:', res);
    this.posMcc=res;
    this.getMccLoader = false;
  }

  posMcc?: any;

  createAccountForm = {
    personalInformation: {
      pidType: 'ID',
      pidNumber: '',
      firstName: '',
      lastName: '',
      emailId: '',
      phone: '',
      branch: '',
      accountNumber: '',
      mcc:'',
         // Document moved here
},
    documents:{
      id: '',           // Document moved here
      shopLicense: ''
    }

}

// 1. Keep the file list and the check function
  otherFileList: any[] = [];

  checkOtherUploadFile = (file: NzUploadFile): boolean => {
    // This replaces the current list with the new file (ensures only 1 file)
    this.otherFileList = [file];
    return false;
  };

// 2. Updated Upload Function
  async uploadShopLicenseOnly() {
    if (this.otherFileList.length === 0) {
      console.error("No file selected for Shop License");
      return;
    }

    try {
      // Process only the otherFileList (which contains the shop license)
      const uploadedDocs = await this.processUpload(this.otherFileList);

      if (uploadedDocs.length > 0) {
        // Map the uploaded ID to your form's shopLicense field
        this.createAccountForm.documents.shopLicense = uploadedDocs[0].id;
        this.documentsUploadDone = true;
        console.log("Shop License uploaded and mapped:", uploadedDocs[0].id);
      }
    } catch (error) {
      console.error("Error uploading Shop License:", error);
    }


  }

  documentsUploadDone: boolean = false;

  processUpload(fileList: any[]): Promise<any[]> {
    const uploadPromises: Promise<any>[] = [];

    fileList.forEach((file: any) => {
      const formData: FormData = new FormData();
      formData.append("files", file);
      formData.append("owner", "SelfService");
      formData.append("operation", "UPLOAD");
      // Updated path to use .id instead of .pidNumber
      formData.append("path", "posman, " + this.createAccountForm.personalInformation.pidNumber);
      formData.append("temporary", "false");
      formData.append("namePrefix", this.createAccountForm.personalInformation.pidNumber);

      const uploadPromise = new Promise<any>((resolve, reject) => {
        this.accountOpeningService.uploadFile(formData).subscribe({
          next: (response) => {
            if (response && response.data) {
              resolve(response.data);
            } else {
              resolve([]);
            }
          },
          error: (error) => reject(error),
        });
      });
      uploadPromises.push(uploadPromise);
    });

    return Promise.all(uploadPromises).then((results) => results.flat());
  }

  async done() {
    this.createAccountLoader = true;

    try {

      let cdnGeneratedId = '';
      // 1. Upload the Shop License (from otherFileList)
      if (this.otherFileList.length > 0) {
        const uploadedDocs = await this.processUpload(this.otherFileList);

        if (uploadedDocs && uploadedDocs.length > 0) {

          //this.createAccountForm.documents.id = uploadedDocs[0].id;
          cdnGeneratedId = uploadedDocs[0].id
          console.log('CDN Upload Success. ID found:', cdnGeneratedId)
        }else{
          this.notification.error('Upload Error', 'CDN did not return a valid file ID.');
          this.createAccountLoader = false;
          return;
        }
      }
      else {
        this.notification.warning('Missing File', 'Please upload the Shop License first.');
        this.createAccountLoader = false;
        return;
      }

      if (!cdnGeneratedId || cdnGeneratedId.trim() === '') {
        console.error('Validation Error: cdnGeneratedId is empty');
        this.notification.error('Error', 'File ID reference is missing. Please re-upload.');
        this.createAccountLoader = false;
        return;
      }

      // 2. Prepare the final payload (Flattening the structure as per your existing code)
      const payload = {

        pidType: this.createAccountForm.personalInformation.pidType,
        pidNumber: this.createAccountForm.personalInformation.pidNumber,
        firstName: this.createAccountForm.personalInformation.firstName,
        lastName: this.createAccountForm.personalInformation.lastName,
        email: this.createAccountForm.personalInformation.emailId,
        phone: this.createAccountForm.personalInformation.phone,
        accountNumber: this.createAccountForm.personalInformation.accountNumber,
        branch: this.createAccountForm.personalInformation.branch,
        mcc: this.createAccountForm.personalInformation.mcc,
        shopLicense: cdnGeneratedId,
      };

      console.log('Submitting Payload:', payload);

      // 3. Trigger the service call
      // The ngOnInit subscription will automatically catch the response
      this.accountOpeningService.createNewRecord(payload, 'posman');

    } catch (error) {
      console.error("Critical error during submission:", error);
      this.notification.create('error', 'Upload Error', 'Failed to process documents.');
      this.createAccountLoader = false;
    }
  }

  isDoneVisible = false;

  handleDoneCancel(): void {
    this.isDoneVisible = false;
    this.navigateTo('home');
  }

  formatIdNumber(value: string) {
    if (value) {
      // 1. Remove dashes and any other non-alphanumeric characters
      // 2. Convert everything to Uppercase
      const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      // 3. Update the form model
      this.createAccountForm.personalInformation.pidNumber = sanitized;
    }
  }

}
