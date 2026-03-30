import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private cfg: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const client: Socket = ctx.switchToWs().getClient();

    // Token sent in socket handshake auth: { auth: { token: 'Bearer ...' } }
    const token =
      client.handshake.auth?.token?.replace('Bearer ', '') ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.cfg.get('JWT_ACCESS_SECRET'),
      });
      const user = await this.authService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      client.data.user = user; // attach user to socket data
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}