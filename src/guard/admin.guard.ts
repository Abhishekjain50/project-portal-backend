import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException, Inject
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, @Inject(DataSource) private readonly dataSource: DataSource) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = request.headers.authorization;
    console.log("token==>>>", token);
    if (!token) {
      throw new UnauthorizedException("AUTH_TOKEN_REQUIRED");
    }
    try {
      if (token.startsWith("Bearer")) {
        token = token.split(" ");
        token = token[1];
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: "secretKey",
      });
      console.log("payload==>>>", payload);
      if (payload) {
          request.body.user_id = payload.user_id;
          request.body.is_admin = payload.is_admin;
      } else {
        throw new UnauthorizedException("TOKEN_MALFORMED");
      }
      request["user"] = payload;
    } catch (error) {
      console.log('AdminAuthGuard verify error:', error);
      // jsonwebtoken sets error.name to 'TokenExpiredError' or 'JsonWebTokenError'
      if (error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('TOKEN_MALFORMED');
      } else if (error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('TOKEN_EXPIRED');
      } else {
        // fallback for other verification errors
        throw new UnauthorizedException('TOKEN_INVALID');
      }
    }
    return true;
  }
}
