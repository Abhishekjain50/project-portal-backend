import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject
} from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  LoginDTO,
  ForgotPasswordDto,
  VerifyOtpDTO,
  ResetPasswordDTO,
} from "./dto";
import { EmailService } from "src/services/email.service";
import * as md5 from "md5";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, Between, IsNull, In } from "typeorm";
import { error } from "console";
import { User } from "src/entities/user.entity";
import { UserToken } from "src/entities/userToken.entity";

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>,
    @Inject(DataSource)
    private dataSource: DataSource,
    private emailService: EmailService
  ) { }
  async login(body: LoginDTO) {
    try {
      let { username, password } = body;
      password = md5(password);


      const userDetails = await this.userRepository.findOne({
        where: { username, is_deleted: false }
      });
      if (!userDetails) throw new UnauthorizedException("INVALID_EMAIL");

      if (userDetails.password != password)
        throw new UnauthorizedException("INVALID_PASSWORD");


      const auth_token = await this.jwtService.sign(
        { user_id: userDetails.id, is_admin: userDetails.is_admin ? 1 : 0 },
        { secret: "secretKey", expiresIn: '1h' }
      );
      console.log(auth_token);

      const refresh_token = await this.jwtService.sign(
        { user_id: userDetails.id, is_admin: userDetails.is_admin ? 1 : 0 },
        { secret: "secretKey", expiresIn: '1d' }
      );
      console.log(refresh_token);

      const userTokenDetails = await this.tokenRepository.findOne({
        where: { user: { id: userDetails.id } },
      });
      if (userTokenDetails) {
        await this.tokenRepository.update(
          { user: { id: userDetails.id } },
          {
            auth_token,
            refresh_token,
          }
        );
      } else {
        await this.tokenRepository.save({
          user: { id: userDetails.id },
          user_id: userDetails.id,
          auth_token,
          refresh_token,
        });
      }

      return { userDetails, auth_token, refresh_token };
    } catch (error) {
      // console.error(error);
      throw error;
    }
  }

  async refresh_token(headers: any, body: any) {
    try {
      const refresh_token = await this.tokenRepository.findOne({
        where: {
          user: { id: body.user_id },
        },
      });

      if (headers.refresh_token.split('.')[0] !== refresh_token.refresh_token.split('.')[0]) {
        throw new UnauthorizedException("REFRESH_MALFORMED");
      }

      const token = await this.jwtService.sign(
        {
          user_id: body.user_id, is_admin: body.is_admin
        },
        { secret: "secretKey", expiresIn: 3600 }
      );

      await this.tokenRepository.update(
        { user: { id: body.user_id } },
        { auth_token: token }
      );

      return { auth_token: token };
    } catch (error) {
      throw error;
    }
  }

  async forgot_password(body: ForgotPasswordDto) {
    try {
      const { username } = body;

      const userDetails = await this.userRepository.findOne({
        where: { username, is_deleted: false }
      });
      if (!userDetails) throw new UnauthorizedException("INVALID_EMAIL");
      
      const otp = await this.generateOtp(4);

      await this.userRepository.update(userDetails.id, {
        otp: otp,
        otp_verify: false,
      });
      
      // Send OTP via email
      await this.emailService.sendOTPEmail(username, otp.toString());
      
      const auth_token = await this.jwtService.sign(
        { user_id: userDetails.id, is_admin: 1 },
        { secret: "secretKey", expiresIn: '1h' }
      );
      console.log(auth_token);


      const userTokenDetails = await this.tokenRepository.findOne({
        where: { user: { id: userDetails.id } },
      });
      if (userTokenDetails) {
        await this.tokenRepository.update(
          { user: { id: userDetails.id } },
          {
            auth_token
          }
        );
      } else {
        await this.tokenRepository.save({
          user: { id: userDetails.id },
          user_id: userDetails.id,
          auth_token
        });
      }

      return { auth_token, otp };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async resend_otp(body) {
    try {
      const { user_id } = body;

      const userDetail = await this.userRepository.findOne({
        where: { id: user_id, is_deleted: false },
        select: { id: true, username: true },
      });
      if (!userDetail) {
        throw new NotFoundException("ID_NOT_FOUND");
      }

      const otp = await this.generateOtp(4);

      await this.userRepository.update(user_id, {
        otp: otp,
        otp_verify: false,
      });

      // Send OTP via email
      await this.emailService.sendOTPEmail(userDetail.username, otp.toString());
      
      return { message: "OTP_RESEND" };
    } catch (error) {
      console.error('Error in resend_otp:', error);
      throw error;
    }
  }

  async otp_verify(body: VerifyOtpDTO) {
    try {
      const { user_id, otp } = body;

      const userDetail = await this.userRepository.findOne({
        where: { id: user_id, otp: otp, is_deleted: false },
        select: { id: true, username: true },
      });

      if (!userDetail) {
        throw {
          message: "INCORRECT_OTP",
          status: 401,
        };
      }

      await this.userRepository.update(user_id, { otp_verify: true });
      return {};
    } catch (error) {
      // console.error(error);
      throw error;
    }
  }

  async reset_password(body: ResetPasswordDTO) {
    try {
      let { password, user_id } = body;
      password = md5(password);
      const userDetail = await this.userRepository.findOne({
        where: { id: user_id, is_deleted: false },
        select: { id: true, username: true },
      });
      if (password == userDetail.password)
        throw {
          message: "OLD_NEW_PASSWORD_SAME",
          status: 401,
        };

      await this.userRepository.update(user_id, {
        password: password
      });
    } catch (error) {
      // console.error(error);
      throw error;
    }
  }

  async logout(headers: any, body: any) {
    try {
      const token_exist = await this.tokenRepository.findOne({
        where: {
          user: { id: body.user_id },
        },
      });

      if (!token_exist) {
        throw {
          message: "USER_ID_NOT_FOUND",
        };
      }
      await this.tokenRepository.remove(token_exist);
      return {};
    } catch (error) {
      throw error;
    }
  }

  async register(body: any, files: any[] = []) {
    try {
      const { username, password, confirmPassword, firstName, lastName, documentType, country, documentNumber, docExpiry, dob, gender, foreignReg, foreignerNumber, terms, autoRead } = body;

      // basic checks
      if (!username) throw { message: "USERNAME_REQUIRED", status: 400 };
      if (!password) throw { message: "PASSWORD_REQUIRED", status: 400 };
      if (password !== confirmPassword) throw { message: "PASSWORD_MISMATCH", status: 400 };

      const existing = await this.userRepository.findOne({ where: { username, is_deleted: false } });
      if (existing) throw { message: "RE_EMAIL_EXIT", status: 409 };

      // The project encodes passwords as hex pairs; decode and md5 like login/reset_password
      
      const finalPassword = md5(password);

      const user = this.userRepository.create({
        username,
        password: finalPassword,
        first_name: firstName,
        last_name: lastName,
        document_type: documentType,
        country,
        document_number: documentNumber,
        doc_expiry: docExpiry ? new Date(docExpiry) : null,
        dob: dob ? new Date(dob) : null,
        gender,
        foreign_reg: foreignReg || false,
        foreigner_number: foreignerNumber || null,
        terms: terms || false,
        auto_read: typeof autoRead === 'undefined' ? true : autoRead,
      });

      // Handle file upload
      if (files && files.length > 0) {
        const file = files[0]; // Take the first file
        user.document_file = file.filename || file.originalname;
        user.document_file = `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${user.document_file}`;
      }

      const saved = await this.userRepository.save(user);
      
      // remove sensitive fields
      // @ts-ignore
      delete saved.password;
      // @ts-ignore
      delete saved.confirm_password;
      const auth_token = await this.jwtService.sign(
        { user_id: saved.id, is_admin: saved.is_admin ? 1 : 0 },
        { secret: "secretKey", expiresIn: '1h' }
      );
      console.log(auth_token);

      const refresh_token = await this.jwtService.sign(
        { user_id: saved.id, is_admin: saved.is_admin ? 1 : 0 },
        { secret: "secretKey", expiresIn: '1d' }
      );
      console.log(refresh_token);

      const userDetails = await this.tokenRepository.findOne({
        where: { user: { id: saved.id } },
      });
      if (userDetails) {
        await this.tokenRepository.update(
          { user: { id: saved.id } },
          {
            auth_token,
            refresh_token,
          }
        );
      } else {
        await this.tokenRepository.save({
          user: { id: saved.id },
          user_id: saved.id,
          auth_token,
          refresh_token,
        });
      }
      return {  saved, auth_token, refresh_token };
    } catch (error) {
      throw error;
    }
  }

  async generateOtp(length: number) {
    try {
      const digits = "123456789";
      let OTP = "";
      for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 9)];
      }

      let otp = parseInt(OTP);
      return parseInt(OTP);
    } catch (error) {
      throw error;
    }
  }

  async createApplication(body: any, files: any, userId: number) {
    try {
      console.log(body)
      if(body.id) {
        delete body.user_id; // prevent changing user_id on update
        await this.dataSource.getRepository("application").update({id: body.id}, {
          ...body,
          face_photo_url: files.face_photo_url ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.face_photo_url}` : null,
          passport_page: files.passport_page ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.passport_page}` : null,
          letter: files.letter ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.letter}` : null,
          created_at: new Date(),
          updated_at: new Date()
        });

        const updated = await this.dataSource.getRepository("application").findOne({where: {id: body.id}});
        return {data: updated}
      } else {
        const application = await this.dataSource.getRepository("application").create({
          ...body,
          user: { id: body.user_id },
          face_photo_url: files.face_photo_url ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.face_photo_url}` : null,
          passport_page: files.passport_page ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.passport_page}` : null,
          letter: files.letter ? `https://thermometrically-riotous-jackelyn.ngrok-free.dev/public/${files.letter}` : null,
          created_at: new Date(),
          updated_at: new Date()
        });

        const saved = await this.dataSource.getRepository("application").save(application);
        return {data: saved}
      }
    } catch (error) {
      throw error;
    }
  }

  async getApplications(userId: number, page: number = 1, limit: number = 10, body) {
    try {
      console.log(userId);
      const skip = (page - 1) * limit;
      
      let where: any = { user: { id: userId } };
      if(body.is_admin) {
        where = {id: Not(IsNull())};
      } else {
        where = { user: { id: userId } };
      }
      
      const [applications, total] = await Promise.all([
        this.dataSource.getRepository("application").find({
          where,
          order: { created_at: 'DESC' },
          skip,
          take: limit
        }),
        this.dataSource.getRepository("application").count({
          where
        })
      ]);

      return {
        applications,
        total
      };
    } catch (error) {
      throw error;
    }
  }

  async getApplicationById(id: number, userId: number) {
    try {
      const application = await this.dataSource.getRepository("application").findOne({
        where: { id, user: { id: userId } }
      });
      
      if (!application) {
        throw new NotFoundException("Application not found");
      }
      
      return application;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(body) {
    try {
      const page = Number(body.page) || 1;
      const limit = Number(body.limit) || 10;
      const skip = (page - 1) * limit;
      const [users, total] = await this.userRepository.findAndCount({
        where: { is_deleted: false },
        select: { id: true, first_name: true, last_name: true, username: true, is_admin: true, is_active: true, country: true, created_at: true },
        order: { created_at: 'DESC' },
        skip: skip,
        take: limit
      });
      return { users, total };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id, is_deleted: false },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async createUser(body: any) {
    try {
      const { username, password, firstName, lastName, documentType, country, documentNumber, docExpiry, dob, gender, foreignReg, foreignerNumber, user_id, id } = body;

      // basic checks
      if (!username) throw { message: "USERNAME_REQUIRED", status: 400 };
      if (!password && !id) throw { message: "PASSWORD_REQUIRED", status: 400 };
      
      let where: any = { username, is_deleted: false };
      if(id){
        where = { username, is_deleted: false, id: Not(id) };
      }
      const existing = await this.userRepository.findOne({ where });
      if (existing) throw { message: "RE_EMAIL_EXIT", status: 409 };

      // The project encodes passwords as hex pairs; decode and md5 like login/reset_password
      
      const finalPassword = password ? md5(password) : null;

      const user = this.userRepository.create({
        username,
        password: finalPassword,
        first_name: firstName,
        last_name: lastName,
        document_type: documentType,
        country,
        document_number: documentNumber,
        doc_expiry: docExpiry ? new Date(docExpiry) : null,
        dob: dob ? new Date(dob) : null,
        gender,
        foreign_reg: foreignReg || false,
        foreigner_number: foreignerNumber || null,
        terms: true,
        auto_read: true,
        created_by: user_id
      });

      if(id){
        const updateData = {
          username,
          first_name: firstName,
          last_name: lastName,
          document_type: documentType,
          country,
          document_number: documentNumber,
          doc_expiry: docExpiry ? new Date(docExpiry) : null,
          dob: dob ? new Date(dob) : null,
          gender,
          foreign_reg: foreignReg || false,
          foreigner_number: foreignerNumber || null,
          terms: true,
          auto_read: true,
          created_by: user_id
        };
        
        // Only update password if provided
        if (finalPassword) {
          updateData["password"] = finalPassword;
        }
        
        await this.userRepository.update({id}, updateData);
      } else {
        await this.userRepository.save(user);
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(body: any) {
    try {
      const { id } = body;
      
      const existing = await this.userRepository.findOne({ where: { id, is_deleted: false } });
      if (!existing) throw { message: "USER_NOT_FOUND", status: 404 };
      
      await this.userRepository.update({id}, { is_deleted: true });
      
      return existing;
    } catch (error) {
      throw error;
    }
  }
}
