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
    // Handle both lowercase and capitalized authorization header
    let token = request.headers.authorization || request.headers.Authorization;
    console.log("token==>>>", token);
    if (!token) {
      throw new UnauthorizedException("AUTH_TOKEN_REQUIRED");
    }
    try {
      // Handle Bearer token format - trim and extract token part
      token = token.trim();
      if (token.toLowerCase().startsWith("bearer")) {
        const parts = token.split(/\s+/);
        if (parts.length < 2 || !parts[1]) {
          throw new UnauthorizedException("TOKEN_MALFORMED");
        }
        token = parts[1];
      }
      if (!token || token === "Bearer" || token === "bearer") {
        throw new UnauthorizedException("TOKEN_MALFORMED - Token value is missing");
      }
      
      // Additional validation - JWT tokens should have 3 parts separated by dots
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Invalid token format - expected 3 parts, got:", tokenParts.length);
        throw new UnauthorizedException("TOKEN_MALFORMED - Invalid token format");
      }
      
      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: "secretKey",
      });
      console.log("payload==>>>", payload);
      console.log("Extracted token length:", token.length);
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
