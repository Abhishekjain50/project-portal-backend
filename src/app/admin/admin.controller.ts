import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  Response,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { ResponseService } from "src/common/response.service";
import { ApiHeader, ApiTags } from "@nestjs/swagger";
import {
  ForgotPasswordDto,
  LoginDTO,
  ResetPasswordDTO,
  VerifyOtpDTO,
} from "./dto";
import { FileInterceptor, FileFieldsInterceptor } from "@nestjs/platform-express";
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { ApiAdminCommonDecorators, ApiAdminRefreshCommonDecorators } from "src/common/swagger.decorator";
import { AdminAuthGuard } from "src/guard/admin.guard";

@Controller("/admin")
@ApiTags("Admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly responseService: ResponseService
  ) { }

  @Get("/health")
  async health(@Req() req, @Res() res: Response) {
    try {
      this.responseService.success(res, "SUCCESS", {});
    } catch (error) {
      throw error;
    }
  }


  @Post("/login")
  async login(@Req() req, @Res() res: Response, @Body() body: LoginDTO) {
    try {
      const data = await this.adminService.login(body);
      this.responseService.success(res, "LOGIN_SUCCESS", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/register")
  @UseInterceptors(
    FileInterceptor('document', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './public';
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(new Error('Only image and PDF files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
      }
    })
  )
  async register(
    @Req() req,
    @Res() res: Response,
    @Body() body,
    @UploadedFile() file?: any
  ) {
    try {
      const data = await this.adminService.register(body, file ? [file] : []);
      this.responseService.success(res, "REGISTER_SUCCESS", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/refresh_token")
  @ApiAdminRefreshCommonDecorators()
  @ApiHeader({
    name: "refresh_token",
    description: "Enter refresh-token",
    required: true,
  })
  async refresh_token(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.refresh_token(req.headers, req.body);
      this.responseService.success(res, "TOKEN_REFRESHED", data);
    } catch (error) {
      // console.error(error);
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/forgot_password")
  async forgot_password(
    @Req() req,
    @Res() res: Response,
    @Body() body: ForgotPasswordDto
  ) {
    try {
      const data = await this.adminService.forgot_password(body);
      this.responseService.success(res, "FORGOT_EMAIL_SENT", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/resend_otp")
  @ApiAdminCommonDecorators()
  async resend_otp(@Req() req, @Res() res: Response, @Body() body) {
    try {
      const data = await this.adminService.resend_otp(body);
      this.responseService.success(res, "OTP_RESEND", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/otp_verify")
  @ApiAdminCommonDecorators()
  async otp_verify(
    @Req() req,
    @Res() res: Response,
    @Body() body: VerifyOtpDTO
  ) {
    try {
      const data = await this.adminService.otp_verify(body);
      this.responseService.success(res, "OTP_VERIFY", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/reset_password")
  @ApiAdminCommonDecorators()
  async reset_password(
    @Req() req,
    @Res() res: Response,
    @Body() body: ResetPasswordDTO
  ) {
    try {
      const data = await this.adminService.reset_password(body);
      this.responseService.success(res, "RESET_SUCCESS", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/logout")
  @ApiAdminCommonDecorators()
  async logout(@Req() req, @Res() res: Response, @Body() body) {
    try {
      const data = await this.adminService.logout(req.headers, body);
      this.responseService.success(res, "LOGOUT_SUCCESS", data);
    } catch (error) {
      // console.error(error);
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/application")
  @ApiAdminCommonDecorators()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'face_photo', maxCount: 1 },
      { name: 'passport_page', maxCount: 1 },
      { name: 'letter', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './public';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(new Error('Only image and PDF files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    })
  )
  async createApplication(
    @Req() req,
    @Res() res: Response,
    @Body() body,
    @UploadedFiles() files: { 
      face_photo?: Express.Multer.File[],
      passport_page?: Express.Multer.File[],
      letter?: Express.Multer.File[]
    }
  ) {
    try {
      console.log(body.user_id)
      const data = await this.adminService.createApplication(
        body,
        {
          face_photo_url: files?.face_photo?.[0]?.filename,
          passport_page: files?.passport_page?.[0]?.filename,
          letter: files?.letter?.[0]?.filename
        },
        req.body.user_id
      );
      this.responseService.success(res, "APPLICATION_SUBMITTED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Get("/applications")
  @ApiAdminCommonDecorators()
  async getApplications(@Req() req, @Res() res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      console.log(req.body);
      const data = await this.adminService.getApplications(req.body.user_id, page, limit, req.body);
      this.responseService.success(res, "APPLICATIONS_FETCHED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Get("/application/:id")
  @ApiAdminCommonDecorators()
  async getApplicationById(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.getApplicationById(parseInt(req.params.id), req.body.user_id);
      this.responseService.success(res, "APPLICATION_FETCHED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/getAllUsers")
  @ApiAdminCommonDecorators()
  async getAllUsers(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.getAllUsers(req.body);
      this.responseService.success(res, "USERS_FETCHED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Get("/getUserById")
  @ApiAdminCommonDecorators()
  async getUserById(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.getUserById(req.query.id);
      this.responseService.success(res, "USER_FETCHED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/createUser")
  @ApiAdminCommonDecorators()
  async createUser(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.createUser(req.body);
      this.responseService.success(res, "USER_CREATED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }

  @Post("/deleteUser")
  @ApiAdminCommonDecorators()
  async deleteUser(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.deleteUser(req.body);
      this.responseService.success(res, "USER_DELETED", data);
    } catch (error) {
      if (error.status) {
        this.responseService.error(req, res, error.message, error.status);
      } else {
        this.responseService.error(req, res, error.message);
      }
    }
  }
}
