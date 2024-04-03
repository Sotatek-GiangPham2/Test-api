import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EError } from '../helpers/constant';
import { httpUnAuthorized } from '../helpers/exceptions';
import jwtr from '../helpers/redis';

@Injectable()
export class GetUserInforGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const header = request.header('Authorization');

		if (!header) {
			request.user = {};
			return true;
		}

		const parts = header.split(' ');
		if (parts.length !== 2 || parts[0] !== 'Bearer') {
			request.user = {};
			return true;
		}

		const token = parts[1];
		const secret = this.configService.get<string>('JWT_SECRET_KEY');

		try {
			request.user = await jwtr.verify(token, secret);
		} catch (error) {
			httpUnAuthorized(EError.INVALID_TOKEN, 'INVALID_TOKEN');
		}

		return true;
	}

	handleRequest(err: any, user: any) {
		if (err || !user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}
