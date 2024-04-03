import {
	checkTokenDto,
	ForgotPasswordDto,
	LoginDto,
	LoginGoogleDto,
	ResetPasswordDto,
	SignupDto,
} from './dtos/auth.req';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { httpBadRequest } from '../../../src/helpers/exceptions';
import { EError } from '../../../src/helpers/constant';
import supabaseClient from '../../../src/helpers/supabase';
import { generateHash, getUsername, validateHash } from '../../../src/helpers/hash-string';
import { MailService } from '../mails/mail.service';
import { randomBytes } from 'crypto';
import jwtr from '../../../src/helpers/redis';
@Injectable()
export class AuthService {
	private readonly client: OAuth2Client;
	constructor(
		private configService: ConfigService,
		private mailService: MailService,
		private jwtService: JwtService,
	) {
		this.client = new OAuth2Client(
			this.configService.get<string>('GOOGLE_CLIENT_ID'),
			this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
			'postmessage',
		);
	}

	async loginGoogle(data: LoginGoogleDto) {
		let userGGData;
		try {
			const { tokens } = await this.client.getToken(data.token);

			const users = await axios.get(`${this.configService.get<string>('GOOGLE_AUTH_VERIFY_URL')}`, {
				headers: { Authorization: `Bearer ${tokens.access_token}` },
			});
			userGGData = users.data;
		} catch (error) {
			httpBadRequest(EError.VERIFY_GOOGLE_CODE_FAILED);
		}

		let currentUser: any = await supabaseClient.from('users').select().eq('email', userGGData.email).single();

		if (currentUser.data != null) {
			currentUser = currentUser.data;
			const getTokens = await this.getTokens(currentUser);

			return {
				accessToken: getTokens.accessToken,
				refreshToken: getTokens.refreshToken,
				user: currentUser,
			};
		}

		await supabaseClient.from('users').insert({
			google_key: userGGData.sub,
			email: userGGData.email,
			username: getUsername(userGGData.email),
			refer_code: await this.generateReferCode(),
		});
		const user = await supabaseClient.from('users').select().eq('email', userGGData.email).single();

		const getTokens = await this.getTokens(user.data);

		return {
			accessToken: getTokens.accessToken,
			refreshToken: getTokens.refreshToken,
			user: user,
		};
	}

	async getTokens(user: any) {
		const expRefresh = moment().add(7, 'd').unix();
		const payload = {
			id: user.id,
			email: user.email,
			username: user.username,
			refer_code: user.refer_code,
			jti: user.id.toString(),
			sub: user.id.toString(),
		};

		const [accessToken, refreshToken] = await Promise.all([
			jwtr.sign(payload, this.configService.get<string>('JWT_SECRET_KEY'), {
				expiresIn: this.configService.get<string>('JWT_EXP_MINUTE') + 'm',
			}),
			jwtr.sign(payload, this.configService.get<string>('JWT_SECRET_KEY'), {
				expiresIn: expRefresh,
			}),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	async register(body: SignupDto) {
		const user = await supabaseClient.from('users').select().eq('email', body.email).single();

		if (user.data != null) {
			httpBadRequest(EError.EXISTED_USER, 'EXISTED_USER');
		}

		await supabaseClient.from('users').insert({
			password: await generateHash(body.password),
			email: body.email,
			username: getUsername(body.email),
			refer_code: await this.generateReferCode(),
		});

		return { message: 'success' };
	}

	async login(body: LoginDto) {
		const user = await (await supabaseClient.from('users').select().eq('email', body.email).single()).data;

		if (user == null) {
			httpBadRequest(EError.USER_NOT_FOUND, 'USER_NOT_FOUND');
		}

		if (!user.password) {
			httpBadRequest(EError.LOGIN_GG_ONLY, 'LOGIN_GG_ONLY');
		}

		const checkPassword = await validateHash(body.password, user.password);

		if (!checkPassword) httpBadRequest(EError.WRONG_PASSWORD, 'WRONG_PASSWORD');

		const getTokens = await this.getTokens(user);

		return {
			accessToken: getTokens.accessToken,
			refreshToken: getTokens.refreshToken,
			user: user,
		};
	}

	async logout(userId: string) {
		try {
			await jwtr.destroy(userId);
			return { message: 'success' };
		} catch (error) {
			console.log(`Failed to invalidate token: ${error}`);
		}
	}

	async forgotPassword(data: ForgotPasswordDto) {
		const user = await (await supabaseClient.from('users').select().eq('email', data.email).single()).data;

		if (user == null) {
			httpBadRequest(EError.USER_NOT_FOUND, 'USER_NOT_FOUND');
		}

		if (!user.password) {
			httpBadRequest(EError.LOGIN_GG_ONLY, 'LOGIN_GG_ONLY');
		}

		const token = this.jwtService.sign(
			{
				email: user.email,
			},
			{
				secret: this.configService.get<string>('JWT_SECRET_KEY'),
				expiresIn: '5m',
			},
		);

		const link = `${this.configService.get('FE_STORAGE_URL')}?token=${token}`;

		await this.mailService.resetPassword(user.email, {
			name: user.username,
			link,
		});
		await supabaseClient
			.from('user_reset_password')
			.upsert({ token, is_used: 0, user_id: user.id, updated_at: new Date() }, { onConflict: 'user_id' })
			.eq('user_id', user.id);

		return { message: 'success' };
	}

	async checkToken(body: checkTokenDto) {
		let jwtData: any;
		try {
			jwtData = this.jwtService.verify(body.token, {
				secret: this.configService.get<string>('JWT_SECRET_KEY'),
			});
		} catch (error) {
			httpBadRequest(EError.INVALID_TOKEN);
		}

		const { data: checkToken } = await supabaseClient
			.from('user_reset_password')
			.select()
			.eq('token', body.token)
			.single();
		if (checkToken == null || checkToken.is_used == 1 || checkToken.token != body.token) {
			httpBadRequest(EError.INVALID_TOKEN, 'INVALID_TOKEN');
		}

		return { message: 'success' };
	}

	async resetPassword(data: ResetPasswordDto) {
		const { data: checkToken } = await supabaseClient
			.from('user_reset_password')
			.select()
			.eq('token', data.token)
			.single();
		if (checkToken == null || checkToken.is_used == 1 || checkToken.token != data.token) {
			httpBadRequest(EError.INVALID_TOKEN, 'INVALID_TOKEN');
		}
		let jwtData: any;
		try {
			jwtData = this.jwtService.verify(data.token, {
				secret: this.configService.get<string>('JWT_SECRET_KEY'),
			});
		} catch (error) {
			httpBadRequest(EError.INVALID_TOKEN);
		}

		const user = (await supabaseClient.from('users').select().eq('email', jwtData.email).single()).data;

		if (user == null) {
			httpBadRequest(EError.USER_NOT_FOUND, 'USER_NOT_FOUND');
		}

		if (!user.password) {
			httpBadRequest(EError.LOGIN_GG_ONLY, 'LOGIN_GG_ONLY');
		}

		const hashedPassword = await generateHash(data.password);
		await supabaseClient.from('users').update({ password: hashedPassword }).eq('email', jwtData.email);
		await supabaseClient.from('user_reset_password').update({ is_used: 1 }).eq('id', checkToken.id);

		return { message: 'success' };
	}

	private async generateReferCode() {
		let referCode = randomBytes(8).toString('hex');

		while ((await supabaseClient.from('users').select().eq('refer_code', referCode).single()).data != null) {
			referCode = randomBytes(8).toString('hex');
		}
		return referCode;
	}

	async getUserInfor(user) {
		return supabaseClient.from('users').select().eq('email', user.email).single();
	}
}
