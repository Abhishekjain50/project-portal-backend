import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, getRepository } from "typeorm";
import { User } from "./user.entity";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: 'application' })
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', unique: true, nullable: true })
  visa_id: number;

  @Column({ type: 'varchar' })
  req_id: string;

  @Column({ nullable: true, type: 'text' })
  purpose: string;

  @Column({ nullable: true, type: 'text' })
  specific_purpose: string;

  @Column({ nullable: true, type: 'text' })
  des_purpose: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true, type: 'text' })
  address: string; 

  @Column({ nullable: true })
  last_name_at_birth: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  passport_issue_country: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  citizenship: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  marital_status: string;

  @Column({ nullable: true })
  country_of_birth: string;

  @Column({ nullable: true })
  father_first_name: string;

  @Column({ nullable: true })
  place_of_birth: string;

  @Column({ nullable: true })
  mother_first_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  type_of_doc: string;

  @Column({ type: 'date', nullable: true })
  date_of_issue: Date;

  @Column({ nullable: true })
  doc_number: string;

  @Column({ type: 'date', nullable: true })
  doc_valid_date: Date;

  @Column({ nullable: true })
  doc_issue_country: string;

  @Column({ nullable: true })
  place_of_issue: string;

  @Column({ nullable: true })
  representation_office: string;

  @Column({ nullable: true })
  first_entry: string;

  @Column({ type: 'date', nullable: true })
  date_of_arrival: Date;

  @Column({ nullable: true })
  means_of_transport: string;

  @Column({ type: 'date', nullable: true })
  date_of_departure: Date;

  @Column({ nullable: true })
  face_photo_url: string;

  @Column({ nullable: true })
  passport_page: string; 

  @Column({ nullable: true })
  invitation_letter: string;

  @Column({ nullable: true })
  certificate_registration: string;

  @Column({ nullable: true })
  employment_proposal: string

  @Column({ nullable: true })
  extract_rulebook: string;

  @Column({ nullable: true })
  diploma_certificate: string;

  @Column({ nullable: true })
  additional1: string;

  @Column({ nullable: true })
  additional2: string;

  @Column({ nullable: true })
  letter: string;

  @Column({ default: false })
  is_consent_provided: boolean;

  @Column({ nullable: true })
  stripe_session_id: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true, length: 10 })
  currency: string;

  @Column({ nullable: true, default: 'Request Submitted' })
  status: string; // success, failed
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ nullable: true })
  consulate: string;

  @Column({ nullable: true })
  arrivalDate: Date | null;

  @Column({ nullable: true })
  departureDate: Date | null

  @Column({ nullable: true })
  borderCrossing: string;

  @Column({ nullable: true })
  transport: string;

  @Column({ nullable: true })
  visaType: string;

  @Column({ nullable: true })
  travelPurpose: string;

  @Column({ nullable: true })
  daysOfStay: string;

  @Column({ nullable: true })
  otherVisaIssued: string

  @Column({ nullable: true })
  previousStay: string;

  @Column({ nullable: true })
  hostName: string;

  @Column({ nullable: true })
  hostTelephone: string;

  @Column({ nullable: true, type: 'text' })
  hostAddress: string;
  
  @Column({ nullable: true })
  hostEmail: string;

  @Column({ nullable: true })
  municipality: string;

  @Column({ nullable: true })
  settlement: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  houseNumber: string;

  @Column({ nullable: true })
  entrance: string;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  apartment: string;

  @Column({ nullable: true })
  whoCovers: string;

  @Column({ nullable: true })
  financialResources: string;

  @Column({ nullable: true })
  passportIssuingCountry: string;

  @Column({ nullable: true })
  travelDocumentType: string;

  @Column({ nullable: true })
  liveOutsideOrigin: string;

  @Column({ nullable: true })
  travelDocumentNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfIssue: Date;

  @Column({ nullable: true })
  countryOfIssue: string;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  @Column({ nullable: true })
  live_outside_origin: string;

  @BeforeInsert()
  async generateIds() {
    this.visa_id = Math.floor(1000 + Math.random() * 9000);

    // Generate a unique req_id using UUID (or you can use another format if you prefer)
    this.req_id = uuidv4();
  }
}
