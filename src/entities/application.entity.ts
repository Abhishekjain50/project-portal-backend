import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'application' })
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  purpose: string;

  @Column({ nullable: true })
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
  letter: string;

  @Column({ default: false })
  is_consent_provided: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
