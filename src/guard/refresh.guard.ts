import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as dotenv from "dotenv";
dotenv.config();

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = request.headers.refresh_token;
    if (!token) {
      throw new UnauthorizedException("REFRESH_TOKEN_REQUIRED");
    }
    try {
      if (token.startsWith("Bearer")) {
        token = token.split(" ");
        token = token[1];
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: "secretKey",
      });
      if (payload) {
        request.body.user_id = payload.user_id;
        request.body.is_admin = payload.is_admin;
      } else throw new UnauthorizedException("REFRESH_MALFORMED");
      request["user"] = payload;
    } catch {
      throw new UnauthorizedException("REFRESH_EXPIRED");
    }
    return true;
  }
}
