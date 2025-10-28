import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "src/guard/admin.guard";
import { UseGuards, UsePipes } from "@nestjs/common";
import { ValidationPipe } from "./validation.pipe";
import { RefreshGuard } from "src/guard/refresh.guard";

export function ApiOperationWithSwaggerSummary(summary: string) {
  return ApiOperation({ summary });
}

export function ApiAuthHeaders() {
  return ApiHeader({
    name: "authorization",
    description: "Enter access-token",
    required: false,
  });
}

export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({ status: 200, description: "Api success" }),
    ApiResponse({ status: 401, description: "Invalid Login credentials." }),
    ApiResponse({ status: 404, description: "Not found!" }),
    ApiResponse({ status: 500, description: "Internal server error!" }),
    ApiResponse({
      status: 403,
      description: "Forbidden, The user does not have access.",
    })
  );
}

export function ApiNonAuthCommonDecorators(text = "") {
  return applyDecorators(
    UsePipes(ValidationPipe),
    ApiSecurity("authorization"),
    ApiCommonResponses(),
    ApiOperationWithSwaggerSummary(text)
  );
}
export function ApiAdminRefreshCommonDecorators(text = "") {
  return applyDecorators(
    UseGuards(RefreshGuard),
    UsePipes(ValidationPipe),
    ApiSecurity("authorization"),
    ApiCommonResponses(),
    ApiOperationWithSwaggerSummary(text)
  );
}

export function ApiAdminCommonDecorators(text = "") {
  return applyDecorators(
    UseGuards(AdminAuthGuard),
    UsePipes(ValidationPipe),
    ApiSecurity("authorization"),
    ApiCommonResponses(),
    ApiOperationWithSwaggerSummary(text),
    ApiAuthHeaders()
  );
}
