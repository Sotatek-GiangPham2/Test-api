import {
	BadRequestException,
	ForbiddenException,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { EError } from './constant';

// 400
// eslint-disable-next-line @typescript-eslint/ban-types
export function httpBadRequest(errorCode?: EError, message?: string, data?: object) {
	throw new BadRequestException({
		code: errorCode,
		data: data || {},
		message: message || '',
	});
}

// 401
// eslint-disable-next-line @typescript-eslint/ban-types
export function httpUnAuthorized(errorCode?: EError, message?: string, data?: object) {
	throw new UnauthorizedException({
		code: errorCode,
		data: data || {},
		message: message || '',
	});
}

// 403
// eslint-disable-next-line @typescript-eslint/ban-types
export function httpForbidden(errorCode?: EError, message?: string, data?: object) {
	throw new ForbiddenException({
		code: errorCode,
		data: data || {},
		message: message || '',
	});
}

// 404
// eslint-disable-next-line @typescript-eslint/ban-types
export function httpNotFound(errorCode?: EError, message?: string, data?: object) {
	throw new NotFoundException({
		code: errorCode,
		data: data || {},
		message: message || '',
	});
}

// 500
// eslint-disable-next-line @typescript-eslint/ban-types
export function httpInternalServerErrorException(errorCode?: EError, message?: string, data?: object) {
	if (!data) {
		data = { error: message };
	}
	throw new InternalServerErrorException({
		code: errorCode,
		data: data || {},
		message: message || '',
	});
}
