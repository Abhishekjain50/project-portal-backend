import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserToken } from "./userToken.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  document_type: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  document_number: string;

  @Column({ type: 'date', nullable: true })
  doc_expiry: Date;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  foreign_reg: string;

  @Column({ nullable: true })
  foreigner_number: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  password: string;

  // confirm_password is usually not stored; included here per request
  @Column({ nullable: true, select: false })
  confirm_password: string;

  @Column({ default: false })
  terms: boolean;

  @Column({ default: true })
  auto_read: boolean;

  @Column({ nullable: true })
  otp: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ default: false })
  otp_verify: boolean;

  @Column({ nullable: true })
  document_file: string;
  
  @Column({ default: false })
  is_admin: boolean;

  @OneToMany(() => UserToken, (userToken) => userToken.user, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  userTokenDetails: UserToken[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ nullable: true })
  created_by: number;
}
