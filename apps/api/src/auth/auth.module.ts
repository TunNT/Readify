import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AdminAuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { ReaderAuthController } from "./reader-auth.controller";
import { ReaderAuthGuard } from "./reader-auth.guard";
import { ReaderAuthService } from "./reader-auth.service";

@Module({ controllers: [AuthController, ReaderAuthController], providers: [AuthService, AdminAuthGuard, ReaderAuthService, ReaderAuthGuard], exports: [AdminAuthGuard, ReaderAuthGuard] })
export class AuthModule {}
