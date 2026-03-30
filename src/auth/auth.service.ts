import {
  Injectable, ConflictException,
  UnauthorizedException, ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private cfg: ConfigService,
  ) {}

  // ── Registration ──────────────────────────────────────────────
  async register(dto: RegisterDto) {
  const exists = await this.userRepo.findOneBy({ email: dto.email });
  if (exists) throw new ConflictException('Email already in use');

  const hashed = await bcrypt.hash(dto.password, 12);
  const user = this.userRepo.create({ ...dto, password: hashed });
  await this.userRepo.save(user);

  const { accessToken, refreshToken } = await this.issueTokens(user);
  await this.saveRefreshToken(user.id, refreshToken);

  return {
    token: accessToken,       // frontend stores this as 'token'
    refreshToken,
    user: this.sanitizeUser(user),
  };
}
  // ── Validate (called by LocalStrategy) ────────────────────────
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  // ── Login ─────────────────────────────────────────────────────
  async login(user: User) {
  const { accessToken, refreshToken } = await this.issueTokens(user);
  await this.saveRefreshToken(user.id, refreshToken);

  return {
    token: accessToken,
    refreshToken,
    user: this.sanitizeUser(user),
  };
}

  // ── Refresh ───────────────────────────────────────────────────
  async refresh(userId: string, incomingRefreshToken: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Access denied');

    const tokenMatch = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
    if (!tokenMatch) throw new ForbiddenException('Access denied');

    const tokens = await this.issueTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken); // rotate
    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null });
  }

  // ── Helpers ───────────────────────────────────────────────────
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }
  
  private sanitizeUser(user: User) {
  const { password, refreshToken, ...safe } = user;
  return safe;
}

  private async issueTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.cfg.get('JWT_ACCESS_SECRET'),
        expiresIn: this.cfg.get('JWT_ACCESS_EXPIRES'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.userRepo.update(userId, { refreshToken: hashed });
  }
}